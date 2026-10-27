import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  candidatesFromRankings,
  parsePubkeyInput,
  recommendPeers,
  type PeerCandidate,
} from "./recommend.ts";

const NOW = 1_700_000_000;
const SELF = "02" + "aa".repeat(32);
const PEER = "02" + "bb".repeat(32);

function candidate(overrides: Partial<PeerCandidate> = {}): PeerCandidate {
  return {
    pubkey: "02" + "11".repeat(32),
    alias: "Hub",
    channels: 80,
    capacitySats: 5e8,
    firstSeen: NOW - 5 * 365 * 86_400,
    updatedAt: NOW - 3_600,
    connectivityRank: 4,
    capacityRank: 12,
    ...overrides,
  };
}

describe("parsePubkeyInput", () => {
  it("accepts a bare key, a host suffix, and surrounding text", () => {
    const key = "03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f";
    assert.equal(parsePubkeyInput(key), key);
    assert.equal(parsePubkeyInput(`  ${key.toUpperCase()}@ln.example  `), key);
    assert.equal(parsePubkeyInput(`node ${key} please`), key);
  });

  it("rejects anything that is not a compressed pubkey", () => {
    assert.equal(parsePubkeyInput(""), null);
    assert.equal(parsePubkeyInput("not-a-node"), null);
    assert.equal(parsePubkeyInput("02abcd"), null);
  });
});

describe("candidatesFromRankings", () => {
  it("keeps connectivity order and attaches a liquidity rank", () => {
    const connectivity = [
      { publicKey: "AA", alias: "One", channels: 40, capacity: 2e8, updatedAt: NOW },
      { publicKey: "BB", alias: "Two", channels: 30, capacity: 1e8, updatedAt: NOW },
    ];
    const liquidity = [
      { publicKey: "bb", alias: "Two", capacity: 9e8 },
      { publicKey: "AA", alias: "One", capacity: 2e8 },
    ];
    const pool = candidatesFromRankings(connectivity, liquidity, 10);
    assert.equal(pool.length, 2);
    assert.equal(pool[0]?.connectivityRank, 1);
    assert.equal(pool[0]?.capacityRank, 2);
    assert.equal(pool[1]?.pubkey, "bb");
    assert.equal(pool[1]?.capacityRank, 1);
    assert.equal(pool[1]?.capacitySats, 1e8);
  });

  it("caps the pool", () => {
    const connectivity = Array.from({ length: 10 }, (_, i) => ({
      publicKey: `key-${i}`,
      alias: `N${i}`,
      channels: 20,
    }));
    assert.equal(candidatesFromRankings(connectivity, [], 3).length, 3);
  });
});

describe("recommendPeers", () => {
  const pool = [
    candidate({ pubkey: SELF, alias: "Self", connectivityRank: 1 }),
    candidate({ pubkey: PEER, alias: "Already", connectivityRank: 2 }),
    candidate({ pubkey: "02" + "01".repeat(32), alias: "Best", connectivityRank: 3 }),
    candidate({
      pubkey: "02" + "02".repeat(32),
      alias: "Next",
      connectivityRank: 8,
      capacityRank: 40,
      firstSeen: NOW - 400 * 86_400,
    }),
    candidate({
      pubkey: "02" + "03".repeat(32),
      alias: "Stale",
      connectivityRank: 4,
      updatedAt: NOW - 10 * 86_400,
    }),
    candidate({
      pubkey: "02" + "04".repeat(32),
      alias: "Tiny",
      connectivityRank: 5,
      channels: 3,
    }),
  ];

  it("drops self, existing peers, stale nodes, and poorly connected nodes", () => {
    const picks = recommendPeers({
      selfPubkey: SELF.toUpperCase(),
      peerPubkeys: [PEER.toUpperCase()],
      candidates: pool,
      now: NOW,
      limit: 5,
    });
    const aliases = picks.map((pick) => pick.alias);
    assert.deepEqual(aliases, ["Best", "Next"]);
    assert.ok(picks.every((pick) => !pick.reason.includes("\n")));
    assert.match(picks[0]?.reason ?? "", /Connectivity #3/);
    assert.match(picks[1]?.reason ?? "", /Connectivity #8/);
  });

  it("prefers a better connectivity rank when freshness and age match", () => {
    const picks = recommendPeers({
      selfPubkey: SELF,
      peerPubkeys: [],
      candidates: [
        candidate({ pubkey: "02" + "22".repeat(32), alias: "Lower", connectivityRank: 12 }),
        candidate({ pubkey: "02" + "21".repeat(32), alias: "Higher", connectivityRank: 2 }),
      ],
      now: NOW,
    });
    assert.deepEqual(picks.map((pick) => pick.alias), ["Higher", "Lower"]);
    assert.ok(picks[0].score > picks[1].score);
  });

  it("respects the limit and returns nothing from an empty pool", () => {
    const picks = recommendPeers({
      selfPubkey: SELF,
      peerPubkeys: [],
      candidates: [
        candidate({ pubkey: "02" + "31".repeat(32), connectivityRank: 1 }),
        candidate({ pubkey: "02" + "32".repeat(32), connectivityRank: 2 }),
        candidate({ pubkey: "02" + "33".repeat(32), connectivityRank: 3 }),
      ],
      now: NOW,
      limit: 2,
    });
    assert.equal(picks.length, 2);
    assert.deepEqual(
      recommendPeers({ selfPubkey: SELF, peerPubkeys: [], candidates: [], now: NOW }),
      [],
    );
  });

  it("writes a one-line reason for an old top-10 hub", () => {
    const [pick] = recommendPeers({
      selfPubkey: SELF,
      peerPubkeys: [],
      candidates: [
        candidate({
          pubkey: "02" + "41".repeat(32),
          alias: "ACINQ",
          connectivityRank: 1,
          channels: 1812,
          capacitySats: 328e8,
          firstSeen: Date.UTC(2019, 0, 3) / 1000,
        }),
      ],
      now: NOW,
    });
    assert.equal(
      pick?.reason,
      "Connectivity #1 since 2019, with 1,812 public channels.",
    );
  });
});
