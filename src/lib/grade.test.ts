import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AGE_FULL_YEARS,
  CHANNELS_FULL,
  FEE_NOTE,
  GRADE_METHOD,
  GRADE_SUMMARY,
  GRADE_WEIGHTS,
  RANK_FLOOR_SCORE,
  UNRANKED_CAP,
  bestStatLine,
  buildGradeSnapshot,
  feeComparison,
  feeMarkFromRates,
  formatGradeDay,
  gradeForNode,
  gradeNode,
  gradeShareText,
  gradeShareUrl,
  gradeStamp,
  heldBackLine,
  isModestGrade,
  letterColor,
  letterFor,
  publicStanding,
  rankMark,
  shareButtonLabel,
  standingLine,
  strengthLine,
  subjectFromProfile,
  topGraded,
  unrankedGradeCeiling,
  xIntentHref,
  type GradeSnapshot,
  type RankingRow,
} from "./grade.ts";

const NOW = 1_800_000_000; // 2027-01-15-ish, fixed
const YEAR = 365.25 * 86_400;

function row(
  publicKey: string,
  alias: string,
  capacity: number,
  channels: number,
  firstSeen: number,
): RankingRow {
  return { publicKey, alias, capacity, channels, firstSeen };
}

function snapshot(overrides: Partial<Parameters<typeof buildGradeSnapshot>[0]> = {}): GradeSnapshot {
  return buildGradeSnapshot({
    liquidity: [
      row("AA", "Whale", 50e8, 400, NOW - 5 * YEAR),
      row("BB", "Hub", 20e8, 200, NOW - 4 * YEAR),
    ],
    connectivity: [
      row("BB", "Hub", 20e8, 900, NOW - 4 * YEAR),
      row("AA", "Whale", 50e8, 400, NOW - 5 * YEAR),
    ],
    age: [row("CC", "Old", 1e6, 2, NOW - 8 * YEAR)],
    medCapacity: 2_000_000,
    nodeCount: 10_000,
    channelCount: 20_000,
    medFeeRate: 100,
    ...overrides,
  });
}

describe("rank marks and letters", () => {
  it("scores rank 1 at 100 and rank 100 at the floor", () => {
    assert.equal(rankMark(1), 100);
    assert.equal(rankMark(100), RANK_FLOOR_SCORE);
    assert.equal(rankMark(100), 55);
    assert.ok(rankMark(2) <= 100);
    assert.ok(rankMark(50) < rankMark(2));
    assert.ok(rankMark(50) > RANK_FLOOR_SCORE);
    assert.ok(rankMark(99) >= RANK_FLOOR_SCORE);
  });

  it("maps score boundaries onto letters", () => {
    assert.equal(letterFor(100), "A+");
    assert.equal(letterFor(97), "A+");
    assert.equal(letterFor(96), "A");
    assert.equal(letterFor(93), "A");
    assert.equal(letterFor(90), "A-");
    assert.equal(letterFor(89), "B+");
    assert.equal(letterFor(83), "B");
    assert.equal(letterFor(80), "B-");
    assert.equal(letterFor(77), "C+");
    assert.equal(letterFor(73), "C");
    assert.equal(letterFor(70), "C-");
    assert.equal(letterFor(67), "D+");
    assert.equal(letterFor(63), "D");
    assert.equal(letterFor(60), "D-");
    assert.equal(letterFor(59), "F");
    assert.equal(letterFor(0), "F");
  });
});

describe("gradeNode", () => {
  it("gives the median unranked node a capacity mark of 50, capped below the top 100", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "dd", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.ok(grade);
    const capacity = grade.factors.find((factor) => factor.key === "capacity");
    assert.equal(capacity?.score, 50);
    assert.ok((capacity?.detail ?? "").includes("median"));
  });

  it("caps a huge unranked node at 54 so it cannot outrank the list", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "ee", capacity: snap.medCapacity * 10_000, channels: 3, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.ok(grade);
    const capacity = grade.factors.find((factor) => factor.key === "capacity");
    assert.equal(capacity?.score, UNRANKED_CAP);
    assert.equal(UNRANKED_CAP, 54);
  });

  it("uses liquidity rank for a listed node and ignores raw size", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "aa", capacity: 1, channels: 1, firstSeen: 0 },
      snap,
      NOW,
    );
    assert.ok(grade);
    const capacity = grade.factors.find((factor) => factor.key === "capacity");
    assert.equal(capacity?.score, 100);
    assert.match(capacity?.detail ?? "", /BTC at snapshot/);
    assert.match(capacity?.detail ?? "", /#1 by capacity/);
    assert.equal(capacity?.rank, 1);
  });

  it("scores the average channel count at 45 and a thousand channels at 100", () => {
    const snap = snapshot();
    assert.equal(snap.avgChannels, 2);
    const average = gradeNode(
      { publicKey: "z1", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    const full = gradeNode(
      {
        publicKey: "z2",
        capacity: snap.medCapacity,
        channels: CHANNELS_FULL,
        firstSeen: NOW - YEAR,
      },
      snap,
      NOW,
    );
    assert.equal(average?.factors.find((factor) => factor.key === "channels")?.score, 45);
    assert.equal(full?.factors.find((factor) => factor.key === "channels")?.score, 100);
  });

  it("scores connectivity rank 1 at 100 and keeps an unranked node under the cap", () => {
    const snap = snapshot();
    const hub = gradeNode(
      { publicKey: "bb", capacity: 1, channels: 1, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    const small = gradeNode(
      { publicKey: "sm", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.equal(hub?.factors.find((factor) => factor.key === "connectivity")?.score, 100);
    const smallConn = small?.factors.find((factor) => factor.key === "connectivity");
    assert.ok(smallConn);
    assert.ok(smallConn.score <= UNRANKED_CAP);
    assert.ok(smallConn.score > 0);
  });

  it("reaches 100 age at three years and does not climb after that", () => {
    const snap = snapshot();
    const young = gradeNode(
      { publicKey: "y", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    const full = gradeNode(
      {
        publicKey: "f",
        capacity: snap.medCapacity,
        channels: 2,
        firstSeen: NOW - AGE_FULL_YEARS * YEAR,
      },
      snap,
      NOW,
    );
    const ancient = gradeNode(
      { publicKey: "o", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - 9 * YEAR },
      snap,
      NOW,
    );
    const age = (grade: typeof young, key = "age") =>
      grade?.factors.find((factor) => factor.key === key)?.score;
    assert.equal(age(young), 33);
    assert.equal(age(full), 100);
    assert.equal(age(ancient), 100);
  });

  it("drops a missing age and rescales the remaining weights", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "na", capacity: snap.medCapacity, channels: 4, firstSeen: 0 },
      snap,
      NOW,
    );
    assert.ok(grade);
    assert.equal(
      grade.factors.some((factor) => factor.key === "age"),
      false,
    );
    const weight = grade.factors.reduce((sum, factor) => sum + factor.weight, 0);
    const expected = Math.round(
      grade.factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / weight,
    );
    assert.equal(grade.score, expected);
    assert.ok(weight < 100);
  });

  it("returns null when fewer than two marks exist", () => {
    const snap = buildGradeSnapshot({
      liquidity: null,
      connectivity: null,
      age: null,
      medCapacity: 0,
      nodeCount: 0,
      channelCount: 0,
      medFeeRate: 0,
    });
    const grade = gradeNode(
      { publicKey: "lonely", capacity: 0, channels: 0, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.equal(grade, null);
  });

  it("scores zero capacity as no capacity mark when the node is unlisted", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "zero", capacity: 0, channels: 3, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.ok(grade);
    assert.equal(
      grade.factors.some((factor) => factor.key === "capacity"),
      false,
    );
  });

  it("is deterministic", () => {
    const snap = snapshot();
    const subject = {
      publicKey: "DD",
      capacity: 5_000_000,
      channels: 8,
      firstSeen: NOW - 2 * YEAR,
    };
    assert.deepEqual(gradeNode(subject, snap, NOW), gradeNode(subject, snap, NOW));
  });

  it("weights sum to 100 and the method text names them", () => {
    const sum =
      GRADE_WEIGHTS.capacity +
      GRADE_WEIGHTS.channels +
      GRADE_WEIGHTS.connectivity +
      GRADE_WEIGHTS.age;
    assert.equal(sum, 100);
    assert.match(GRADE_METHOD, /capacity 30/);
    assert.match(GRADE_METHOD, /channels 20/);
    assert.match(GRADE_METHOD, /connectivity 30/);
    assert.match(GRADE_METHOD, /age 20/);
    assert.match(GRADE_METHOD, /54/);
    assert.match(GRADE_METHOD, /maxes out at 54/);
    assert.match(GRADE_METHOD, /3 years/);
    assert.match(GRADE_SUMMARY, /top 100/);
    assert.match(GRADE_SUMMARY, /score F/);
    assert.match(FEE_NOTE, /not part of the grade/i);
  });

  it("does not put the unranked cap jargon on the capacity caption", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "dd", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    const detail = grade?.factors.find((factor) => factor.key === "capacity")?.detail ?? "";
    assert.match(detail, /at snapshot/);
    assert.doesNotMatch(detail, /cap 54/);
  });
});

describe("snapshot merge and top 20", () => {
  it("lowercases keys, keeps max capacity and channels, and ranks in API order", () => {
    const snap = snapshot({
      liquidity: [row("AbC", "One", 10, 4, NOW - YEAR), row("ABC", "One long alias", 30, 2, NOW - 2 * YEAR)],
      connectivity: [row("abc", "x", 5, 9, 0)],
    });
    assert.equal(snap.liquidityRank.abc, 1);
    assert.equal(snap.connectivityRank.abc, 1);
    assert.equal(Object.keys(snap.liquidityRank).length, 1);
    const merged = snap.ranked.find((node) => node.publicKey === "abc");
    assert.equal(merged?.capacity, 30);
    assert.equal(merged?.channels, 9);
    assert.equal(merged?.firstSeen, NOW - 2 * YEAR);
    assert.equal(merged?.alias, "One long alias");
    assert.equal(snap.connectivityFloor, 9);
    assert.equal(snap.medFeeRate, 100);
  });

  it("sorts the top list by score, then capacity, and caps the length", () => {
    const snap = snapshot();
    const top = topGraded(snap, NOW, 2);
    assert.equal(top.length, 2);
    assert.ok(top[0].grade.score >= top[1].grade.score);
    const all = topGraded(snap, NOW, 20);
    assert.ok(all.length <= 20);
    assert.ok(all.some((row) => row.node.publicKey === "aa"));
  });

  it("prefers snapshot inputs for a ranked pubkey", () => {
    const snap = snapshot();
    const subject = subjectFromProfile(
      { publicKey: "AA", capacity: 1, channels: 1, firstSeen: 0 },
      snap,
    );
    assert.equal(subject.capacity, 50e8);
    assert.equal(subject.channels, 400);
    assert.equal(subject.firstSeen, NOW - 5 * YEAR);
    const fromProfile = gradeForNode(
      { publicKey: "AA", capacity: 1, channels: 1, firstSeen: 0 },
      snap,
      NOW,
    );
    const direct = gradeNode(subject, snap, NOW);
    assert.deepEqual(fromProfile, direct);
  });
});

describe("fee mark and share links", () => {
  it("scores a fee at the network median as 100 and a 4x fee as 50", () => {
    const even = feeMarkFromRates([80, 120], 100);
    assert.equal(even?.medianPpm, 100);
    assert.equal(even?.score, 100);
    assert.equal(even?.sampleSize, 2);
    const high = feeMarkFromRates([400], 100);
    assert.equal(high?.score, 50);
    const zero = feeMarkFromRates([0, 0], 100);
    assert.equal(zero?.score, 0);
    assert.equal(feeMarkFromRates([], 100), null);
    assert.equal(feeMarkFromRates([10], 0), null);
  });

  it("builds a share URL with ref=share and an X intent for that URL", () => {
    const url = gradeShareUrl("AbC", "https://ln.fyi/");
    assert.equal(url, "https://ln.fyi/nodes/abc?ref=share");
    const text = gradeShareText("  ACINQ\n", "A+", 100, {
      standing: { rank: 1, total: 14832, bounded: true },
    });
    assert.equal(text, "ACINQ scores A+ (100), #1 of 14,832 Lightning nodes");
    const mid = gradeShareText("LNT.Thailand", "C", 74, {
      standing: { rank: 212, total: 14832, bounded: true },
    });
    assert.equal(mid, "LNT.Thailand scores C (74), #212 of 14,832 Lightning nodes");
    assert.equal(
      gradeShareText("LNT", "F", 27, {
        standing: { rank: 400, total: 14832, bounded: false },
      }),
      "LNT scores F (27) on ln.fyi",
    );
    const href = xIntentHref(text, url);
    assert.ok(href.startsWith("https://twitter.com/intent/tweet?"));
    assert.ok(href.includes("ref%3Dshare"));
    assert.equal(gradeShareText("   ", "C", 74), "This node scores C (74) on ln.fyi");
    const modest = gradeShareText("LNT", "F", 42, { lead: "4.2 years on a 3-year scale" });
    assert.match(modest, /^LNT — 4\.2 years/);
    assert.match(modest, /Grade F \(42\)/);
    assert.equal(shareButtonLabel("A+"), "Share on X");
    assert.equal(shareButtonLabel("C"), "Share on X");
    assert.equal(shareButtonLabel("D+"), "Share node");
    assert.equal(shareButtonLabel("F"), "Share node");
    assert.equal(isModestGrade("D-"), true);
    assert.equal(isModestGrade("C"), false);
  });

  it("describes fees without a 0-100 score", () => {
    const high = feeMarkFromRates([2499], 105);
    assert.ok(high);
    const line = feeComparison(high);
    assert.match(line, /^Fees: 24× the network median \(2,499 vs 105 ppm\)/);
    assert.match(line, /not part of the grade/);
    assert.doesNotMatch(line, /FEE SAMPLE/);
    assert.doesNotMatch(line, new RegExp(`\\b${high.score}\\b`));
    const zero = feeMarkFromRates([0, 0], 100);
    assert.ok(zero);
    assert.equal(zero.score, 0);
    const zeroLine = feeComparison(zero);
    assert.match(zeroLine, /^Fees: below the network median \(0 vs 100 ppm\)/);
    assert.doesNotMatch(zeroLine, /0×/);
    assert.doesNotMatch(zeroLine, /FEE SAMPLE/);
    const even = feeMarkFromRates([100], 100);
    assert.match(feeComparison(even!), /at the network median/);
  });
});

describe("rank, colors, and held-back copy", () => {
  it("formats the snapshot day in UTC", () => {
    const unix = Date.UTC(2026, 9, 27) / 1000;
    assert.equal(formatGradeDay(unix), "Oct 27");
    assert.equal(gradeStamp(unix), "Graded Oct 27 · daily snapshot");
  });

  it("colors A amber, B through D off-white, and F muted red", () => {
    assert.equal(letterColor("A+"), "#ff8a3d");
    assert.equal(letterColor("A"), "#ff8a3d");
    assert.equal(letterColor("A-"), "#ff8a3d");
    assert.equal(letterColor("B"), "#eceae3");
    assert.equal(letterColor("C+"), "#eceae3");
    assert.equal(letterColor("D-"), "#eceae3");
    assert.equal(letterColor("F"), "rgba(229, 72, 77, 0.85)");
  });

  it("names the two weakest marks below an A", () => {
    const snap = snapshot();
    const grade = gradeNode(
      { publicKey: "dd", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.ok(grade);
    assert.notEqual(grade.letter, "A+");
    assert.notEqual(grade.letter, "A");
    const line = heldBackLine(grade);
    assert.match(line ?? "", /^Held back by /);
    const top = gradeNode(
      { publicKey: "aa", capacity: 50e8, channels: 400, firstSeen: NOW - 5 * YEAR },
      snap,
      NOW,
    );
    assert.ok(top);
    if (top.letter === "A+" || top.letter === "A") {
      assert.equal(heldBackLine(top), null);
    }
    assert.ok(bestStatLine(grade).length > 0);
  });

  it("ranks a public node instead of rounding every high score to 99", () => {
    const snap = snapshot();
    assert.equal(unrankedGradeCeiling(), 72);
    assert.equal(snap.nodeCount, 10_000);
    const low = gradeNode(
      { publicKey: "dd", capacity: snap.medCapacity, channels: 2, firstSeen: NOW - YEAR },
      snap,
      NOW,
    );
    assert.ok(low);
    assert.ok(low.score <= unrankedGradeCeiling());
    const lowStanding = publicStanding("dd", low.score, snap, NOW);
    assert.equal(lowStanding?.bounded, false);
    const top = gradeNode(
      { publicKey: "aa", capacity: 50e8, channels: 400, firstSeen: NOW - 5 * YEAR },
      snap,
      NOW,
    );
    const hub = gradeNode(
      { publicKey: "bb", capacity: 20e8, channels: 900, firstSeen: NOW - 4 * YEAR },
      snap,
      NOW,
    );
    assert.ok(top && hub);
    const topStanding = publicStanding("aa", top.score, snap, NOW);
    const hubStanding = publicStanding("bb", hub.score, snap, NOW);
    assert.equal(topStanding?.bounded, true);
    assert.equal(hubStanding?.bounded, true);
    assert.equal(topStanding?.total, 10_000);
    assert.equal(Math.min(topStanding?.rank ?? 99, hubStanding?.rank ?? 99), 1);
    assert.notEqual(topStanding?.rank, hubStanding?.rank);
    assert.equal(standingLine({ rank: 1, total: 14832, bounded: true }), "#1 of 14,832 public nodes");
    assert.equal(standingLine({ rank: 212, total: 14832, bounded: true }), "#212 of 14,832 public nodes");
    assert.doesNotMatch(standingLine(topStanding!), /99%/);
    assert.doesNotMatch(standingLine(hubStanding!), /99%/);
  });

  it("leads with a strength only at 70 or a top-half rank", () => {
    assert.equal(
      strengthLine(
        {
          score: 40,
          letter: "F",
          factors: [
            {
              key: "connectivity",
              label: "Connectivity",
              weight: 30,
              score: 99,
              detail: "Rank #4",
              rank: 4,
            },
          ],
        },
        14_000,
      ),
      "Connectivity 99 · #4 by channels",
    );
    assert.equal(
      strengthLine(
        {
          score: 55,
          letter: "F",
          factors: [
            {
              key: "capacity",
              label: "Capacity",
              weight: 30,
              score: 55,
              detail: "Rank #80",
              rank: 80,
            },
          ],
        },
        14_000,
      ),
      "Capacity 55 · #80 by capacity",
    );
    assert.equal(
      strengthLine(
        {
          score: 27,
          letter: "F",
          factors: [
            {
              key: "channels",
              label: "Channels",
              weight: 20,
              score: 40,
              detail: "1 channel at snapshot vs 1.9 average",
            },
            { key: "age", label: "Age", weight: 20, score: 36, detail: "1.1 years" },
            { key: "capacity", label: "Capacity", weight: 30, score: 30, detail: "0.01 BTC" },
            { key: "connectivity", label: "Connectivity", weight: 30, score: 8, detail: "below" },
          ],
        },
        14_832,
      ),
      null,
    );
  });
});
