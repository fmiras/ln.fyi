import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GRADE_WEIGHTS,
  gradeNode,
  letterGrade,
  scoreAge,
  scoreCapacity,
  scoreChannels,
  scoreConnectivity,
  scoreFeeMedian,
  scorePresence,
  type GradeInput,
} from "./grade.ts";

const NOW = 1_700_000_000;

function input(overrides: Partial<GradeInput> = {}): GradeInput {
  return {
    capacitySats: 0,
    activeChannels: 0,
    firstSeen: null,
    updatedAt: null,
    now: NOW,
    clearnetSockets: 0,
    torSockets: 0,
    feeRatesPpm: [],
    peerChannelCounts: [],
    history: [],
    capacityRank: null,
    connectivityRank: null,
    ...overrides,
  };
}

describe("letterGrade", () => {
  it("follows the published bands", () => {
    assert.equal(letterGrade(100), "A+");
    assert.equal(letterGrade(97), "A+");
    assert.equal(letterGrade(96), "A");
    assert.equal(letterGrade(93), "A");
    assert.equal(letterGrade(90), "A-");
    assert.equal(letterGrade(89), "B+");
    assert.equal(letterGrade(80), "B-");
    assert.equal(letterGrade(79), "C+");
    assert.equal(letterGrade(70), "C-");
    assert.equal(letterGrade(60), "D");
    assert.equal(letterGrade(59), "F");
    assert.equal(letterGrade(0), "F");
  });
});

describe("factor scores", () => {
  it("weights sum to 100", () => {
    const total = Object.values(GRADE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    assert.equal(total, 100);
  });

  it("raises capacity and channel scores as the node gets larger", () => {
    assert.ok(scoreCapacity(0.01e8) > scoreCapacity(0));
    assert.ok(scoreCapacity(1e8) > scoreCapacity(0.2e8));
    assert.ok(scoreCapacity(50e8) > scoreCapacity(10e8));
    assert.equal(scoreCapacity(80e8), 100);
    assert.ok(scoreChannels(30) > scoreChannels(4));
    assert.ok(scoreChannels(400) > scoreChannels(80));
    assert.equal(scoreChannels(0), 8);
  });

  it("treats a sensible fee as stronger than a very expensive one", () => {
    assert.equal(scoreFeeMedian(20), 100);
    assert.ok(scoreFeeMedian(100) > scoreFeeMedian(2000));
    assert.ok(scoreFeeMedian(3000) < scoreFeeMedian(800));
  });

  it("scores age from first seen and stays neutral when the date is missing", () => {
    assert.equal(scoreAge(null, NOW).known, false);
    assert.equal(scoreAge(null, NOW).score, 60);
    assert.equal(scoreAge(NOW + 10, NOW).known, false);
    const young = scoreAge(NOW - 10 * 86_400, NOW);
    const old = scoreAge(NOW - 6 * 365 * 86_400, NOW);
    assert.equal(young.known, true);
    assert.ok((old.score as number) > (young.score as number));
    assert.equal(old.score, 100);
  });

  it("measures presence as announced days over the trailing window", () => {
    assert.deepEqual(scorePresence([]), { score: 60, known: false, present: 0, expected: 30 });
    const end = 20_000 * 86_400;
    const full = Array.from({ length: 30 }, (_, i) => ({
      added: end - (29 - i) * 86_400,
      capacity: 1,
      channels: 1,
    }));
    assert.deepEqual(scorePresence(full), { score: 100, known: true, present: 30, expected: 30 });
    const missing = new Set([3, 4, 5, 10, 11, 12, 20, 21, 22, 25]);
    const gapped = full.filter((_, index) => !missing.has(index));
    const scored = scorePresence(gapped);
    assert.equal(scored.known, true);
    assert.equal(scored.expected, 30);
    assert.equal(scored.present, 20);
    assert.equal(scored.score, 67);
  });

  it("uses connectivity rank when the node is listed and stays modest when it is not", () => {
    const ranked = scoreConnectivity({
      rank: 4,
      activeChannels: 400,
      peerChannelCounts: [100, 80, 90],
      clearnetSockets: 1,
      torSockets: 1,
    });
    const unranked = scoreConnectivity({
      rank: null,
      activeChannels: 400,
      peerChannelCounts: [100, 80, 90],
      clearnetSockets: 1,
      torSockets: 1,
    });
    assert.ok(ranked > unranked);
    assert.ok(unranked <= 70);
    const dark = scoreConnectivity({
      rank: null,
      activeChannels: 0,
      peerChannelCounts: [],
      clearnetSockets: 0,
      torSockets: 0,
    });
    assert.ok(dark < 20);
  });
});

describe("gradeNode", () => {
  it("explains every factor and weights them into one score", () => {
    const grade = gradeNode(
      input({
        capacitySats: 12e8,
        activeChannels: 220,
        firstSeen: NOW - 6 * 365 * 86_400,
        updatedAt: NOW - 3_600,
        clearnetSockets: 1,
        torSockets: 1,
        feeRatesPpm: [40, 80, 20],
        peerChannelCounts: [100, 120, 90],
        history: Array.from({ length: 30 }, (_, i) => ({
          added: NOW - (29 - i) * 86_400,
          capacity: 12e8,
          channels: 220,
        })),
        capacityRank: 8,
        connectivityRank: 3,
      }),
    );
    assert.equal(grade.factors.length, 6);
    assert.ok(grade.factors.every((factor) => factor.rule.length > 20 && factor.detail.length > 8));
    const manual = Math.round(
      grade.factors.reduce((sum, factor) => sum + (factor.score * factor.weight) / 100, 0),
    );
    assert.equal(grade.score, manual);
    assert.equal(grade.letter, letterGrade(grade.score));
    assert.ok(grade.score >= 90, `expected a strong node to score highly, got ${grade.score}`);
    assert.match(grade.summary, /^A/);
    assert.match(grade.factors.find((factor) => factor.id === "fees")?.detail ?? "", /40 ppm/);
    assert.match(grade.factors.find((factor) => factor.id === "connectivity")?.detail ?? "", /#3/);
  });

  it("does not invent a high grade for an empty node", () => {
    const grade = gradeNode(input());
    assert.equal(grade.letter, "F");
    assert.ok(grade.score < 60);
    const fees = grade.factors.find((factor) => factor.id === "fees");
    const presence = grade.factors.find((factor) => factor.id === "presence");
    assert.equal(fees?.known, false);
    assert.equal(fees?.score, 60);
    assert.equal(presence?.known, false);
    assert.match(grade.summary, /lightest on/i);
  });

  it("increases the total when capacity increases and nothing else changes", () => {
    const small = gradeNode(input({ capacitySats: 0.1e8, activeChannels: 8, clearnetSockets: 1 }));
    const large = gradeNode(input({ capacitySats: 30e8, activeChannels: 8, clearnetSockets: 1 }));
    assert.ok(large.score > small.score);
  });
});
