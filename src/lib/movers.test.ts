import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extremesBy, selectCohort, weeklySnapshotDelta } from "./movers.ts";

const DAY = 86_400;

describe("weeklySnapshotDelta", () => {
  it("compares the latest point with the snapshot about seven days earlier", () => {
    const latest = 1_800_000_000;
    const delta = weeklySnapshotDelta([
      { added: latest - 8 * DAY, capacity: 10, channels: 4 },
      { added: latest - 7 * DAY, capacity: 12, channels: 5 },
      { added: latest, capacity: 15, channels: 3 },
    ]);
    assert.equal(delta?.capacityDelta, 3);
    assert.equal(delta?.channelDelta, -2);
    assert.equal(delta?.prior.added, latest - 7 * DAY);
  });

  it("rejects a series that does not reach back about a week", () => {
    const latest = 1_800_000_000;
    assert.equal(
      weeklySnapshotDelta([
        { added: latest - 2 * DAY, capacity: 10, channels: 1 },
        { added: latest, capacity: 11, channels: 1 },
      ]),
      null,
    );
    assert.equal(
      weeklySnapshotDelta([
        { added: latest - 20 * DAY, capacity: 10, channels: 1 },
        { added: latest, capacity: 11, channels: 1 },
      ]),
      null,
    );
    assert.equal(weeklySnapshotDelta([{ added: latest, capacity: 1, channels: 1 }]), null);
  });
});

describe("selectCohort", () => {
  it("interleaves liquidity and connectivity and caps the union", () => {
    const liquidity = Array.from({ length: 10 }, (_, i) => ({ publicKey: `L${i}` }));
    const connectivity = Array.from({ length: 10 }, (_, i) => ({
      publicKey: i < 4 ? `L${i}` : `C${i}`,
    }));
    const cohort = selectCohort(liquidity, connectivity, { liquidity: 10, connectivity: 10, max: 8 });
    assert.equal(cohort.length, 8);
    assert.equal(cohort[0]?.publicKey, "L0");
    assert.ok(cohort.some((node) => node.publicKey === "C4"));
    assert.equal(new Set(cohort.map((node) => node.publicKey.toLowerCase())).size, 8);
  });
});

describe("extremesBy", () => {
  it("splits gainers and losers and drops flats", () => {
    const rows = [
      { pubkey: "a", delta: 5 },
      { pubkey: "b", delta: -2 },
      { pubkey: "c", delta: 1 },
      { pubkey: "d", delta: 0 },
      { pubkey: "e", delta: -8 },
    ];
    const split = extremesBy(rows, (row) => row.delta, 1);
    assert.deepEqual(split.gainers.map((row) => row.pubkey), ["a"]);
    assert.deepEqual(split.losers.map((row) => row.pubkey), ["e"]);
  });
});
