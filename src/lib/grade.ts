/**
 * Public node report card.
 *
 * Computed from the daily ranking snapshot (top 100 by capacity, top 100 by
 * channels, network median and average) plus the node's own capacity,
 * channel count, and first-seen time. No per-node upstream calls.
 *
 * Fee policy is a separate mark. The only fee sample we have without a new
 * fetch is the first page of open channels the profile already loaded, so it
 * is shown beside the grade and left out of the number. The share image and
 * the top-20 list then use the same score.
 */

export const GRADE_WEIGHTS = {
  capacity: 30,
  channels: 20,
  connectivity: 30,
  age: 20,
} as const;

export const AGE_FULL_YEARS = 3;
export const RANK_LIST_SIZE = 100;
/** Score at rank 100. Rank 1 is 100. */
export const RANK_FLOOR_SCORE = 55;
/** Outside the top 100, capacity and connectivity cannot outrank #100. */
export const UNRANKED_CAP = RANK_FLOOR_SCORE - 1;
/** Channel mark reaches 100 at this many channels. */
export const CHANNELS_FULL = 1000;
export const TOP_GRADE_COUNT = 20;

const YEAR_SECONDS = 365.25 * 86_400;

export type GradeFactorKey = keyof typeof GRADE_WEIGHTS;

export type GradeFactor = {
  key: GradeFactorKey;
  label: string;
  weight: number;
  score: number;
  detail: string;
};

export type NodeGrade = {
  score: number;
  letter: string;
  factors: GradeFactor[];
};

export type RankedNode = {
  publicKey: string;
  alias: string;
  capacity: number;
  channels: number;
  firstSeen: number;
};

export type GradeSnapshot = {
  medCapacity: number;
  avgChannels: number;
  medFeeRate: number;
  connectivityFloor: number;
  liquidityRank: Record<string, number>;
  connectivityRank: Record<string, number>;
  ranked: RankedNode[];
};

export type GradeSubject = {
  publicKey: string;
  capacity: number;
  channels: number;
  firstSeen: number;
};

export type RankingRow = {
  publicKey: string;
  alias?: string;
  capacity?: number;
  channels?: number;
  firstSeen?: number;
};

export const GRADE_METHOD =
  "Capacity and connectivity are rank marks: 100 at #1 of the public top 100, 55 at #100, and at most 54 outside that list. Outside the list, capacity is a log curve around the network median, where the median scores 50. Channels are a log curve, 45 at the average public node and 100 at 1,000 channels. Age reaches 100 at 3 years. Weights are capacity 30, channels 20, connectivity 30, and age 20. A missing mark is dropped and the rest are rescaled.";

export const FEE_NOTE =
  "The fee mark uses the median fee_rate on the open channels already loaded with this profile (the first page), against the network median. It is 100 at that median and loses 25 points per doubling of the distance. It is not part of the grade, so the share image and the top 20 stay on the same number.";

export function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function rankMark(rank: number): number {
  if (!Number.isFinite(rank) || rank < 1) return 0;
  const capped = Math.min(rank, RANK_LIST_SIZE);
  const span = 100 - RANK_FLOOR_SCORE;
  const raw = 100 - (capped - 1) * (span / (RANK_LIST_SIZE - 1));
  return clamp(Math.round(raw));
}

export function letterFor(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

/** Hex used on the page and in the share image. */
export function letterColor(letter: string): string {
  if (letter.startsWith("A")) return "#ff8a3d";
  if (letter.startsWith("B")) return "#7fd8a4";
  if (letter.startsWith("C")) return "#eceae3";
  if (letter.startsWith("D")) return "#9c998f";
  return "#ff6b6b";
}

export function formatCount(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(Math.round(n)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatBtc(sats: number): string {
  const btc = sats / 1e8;
  if (!Number.isFinite(btc)) return "0";
  if (btc >= 100) return btc.toFixed(0);
  if (btc >= 1) return btc.toFixed(2);
  if (btc >= 0.01) return btc.toFixed(3);
  return btc.toFixed(4);
}

function formatYears(seconds: number): string {
  const years = seconds / YEAR_SECONDS;
  if (years >= 10) return `${Math.round(years)} years`;
  return `${(Math.round(years * 10) / 10).toFixed(1)} years`;
}

function keyOf(pubkey: string): string {
  return pubkey.trim().toLowerCase();
}

function rankMap(rows: RankingRow[] | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!rows) return out;
  let rank = 0;
  for (const row of rows) {
    const key = keyOf(row.publicKey || "");
    if (!key || out[key]) continue;
    rank += 1;
    out[key] = rank;
  }
  return out;
}

export function buildGradeSnapshot(input: {
  liquidity: RankingRow[] | null;
  connectivity: RankingRow[] | null;
  age: RankingRow[] | null;
  medCapacity: number;
  nodeCount: number;
  channelCount: number;
  medFeeRate: number;
}): GradeSnapshot {
  const liquidityRank = rankMap(input.liquidity);
  const connectivityRank = rankMap(input.connectivity);
  const byKey = new Map<string, RankedNode>();
  const absorb = (rows: RankingRow[] | null) => {
    if (!rows) return;
    for (const row of rows) {
      const publicKey = keyOf(row.publicKey || "");
      if (!publicKey) continue;
      const capacity = Number(row.capacity) || 0;
      const channels = Number(row.channels) || 0;
      const firstSeen = Number(row.firstSeen) || 0;
      const alias = (row.alias || "").trim();
      const prev = byKey.get(publicKey);
      if (!prev) {
        byKey.set(publicKey, {
          publicKey,
          alias: alias || "Anonymous",
          capacity,
          channels,
          firstSeen,
        });
        continue;
      }
      prev.capacity = Math.max(prev.capacity, capacity);
      prev.channels = Math.max(prev.channels, channels);
      if (firstSeen > 0 && (prev.firstSeen <= 0 || firstSeen < prev.firstSeen)) {
        prev.firstSeen = firstSeen;
      }
      if (alias && (prev.alias === "Anonymous" || alias.length > prev.alias.length)) {
        prev.alias = alias;
      }
    }
  };
  absorb(input.liquidity);
  absorb(input.connectivity);
  absorb(input.age);

  const connectivity = input.connectivity ?? [];
  let connectivityFloor = 0;
  for (let i = connectivity.length - 1; i >= 0; i -= 1) {
    const channels = Number(connectivity[i]?.channels) || 0;
    if (channels > 0) {
      connectivityFloor = channels;
      break;
    }
  }

  const nodeCount = Number(input.nodeCount) || 0;
  const channelCount = Number(input.channelCount) || 0;
  return {
    medCapacity: Number(input.medCapacity) || 0,
    avgChannels: nodeCount > 0 ? channelCount / nodeCount : 0,
    medFeeRate: Number(input.medFeeRate) || 0,
    connectivityFloor,
    liquidityRank,
    connectivityRank,
    ranked: [...byKey.values()],
  };
}

function capacityMark(
  capacity: number,
  rank: number | undefined,
  medCapacity: number,
): { score: number; detail: string } | null {
  if (rank) {
    return {
      score: rankMark(rank),
      detail: `Rank #${formatCount(rank)} of the top ${RANK_LIST_SIZE} by capacity`,
    };
  }
  if (!(capacity > 0) || !(medCapacity > 0)) return null;
  const raw = 50 + 20 * Math.log10(capacity / medCapacity);
  return {
    score: clamp(Math.round(raw), 0, UNRANKED_CAP),
    detail: `${formatBtc(capacity)} BTC vs ${formatBtc(medCapacity)} BTC median, cap ${UNRANKED_CAP}`,
  };
}

function channelMark(
  channels: number,
  avgChannels: number,
): { score: number; detail: string } | null {
  if (!(avgChannels > 0) || !(CHANNELS_FULL > avgChannels)) return null;
  if (!(channels > 0)) {
    return { score: 0, detail: "No active channels" };
  }
  const denom = Math.log10(CHANNELS_FULL / avgChannels);
  const raw = 45 + (55 * Math.log10(channels / avgChannels)) / denom;
  const avgLabel = avgChannels >= 10 ? avgChannels.toFixed(0) : avgChannels.toFixed(1);
  return {
    score: clamp(Math.round(raw)),
    detail: `${formatCount(channels)} channels vs ${avgLabel} average`,
  };
}

function connectivityMark(
  channels: number,
  rank: number | undefined,
  floor: number,
): { score: number; detail: string } | null {
  if (rank) {
    return {
      score: rankMark(rank),
      detail: `Rank #${formatCount(rank)} of the top ${RANK_LIST_SIZE} by channels`,
    };
  }
  if (!(floor > 0)) return null;
  if (!(channels > 0)) {
    return { score: 0, detail: `Below the top ${RANK_LIST_SIZE}` };
  }
  const raw = (UNRANKED_CAP * Math.log10(1 + channels)) / Math.log10(1 + floor);
  return {
    score: clamp(Math.round(raw), 0, UNRANKED_CAP),
    detail: `${formatCount(channels)} channels, below the top-${RANK_LIST_SIZE} floor of ${formatCount(floor)}`,
  };
}

function ageMark(
  firstSeen: number,
  now: number,
): { score: number; detail: string } | null {
  if (!(firstSeen > 0) || !(now > firstSeen)) return null;
  const elapsed = now - firstSeen;
  const years = elapsed / YEAR_SECONDS;
  return {
    score: clamp(Math.round((100 * years) / AGE_FULL_YEARS)),
    detail: `${formatYears(elapsed)} on a ${AGE_FULL_YEARS}-year scale`,
  };
}

/**
 * Prefer the ranking snapshot when this pubkey is in it, so the node page,
 * the share image, and the top 20 use one set of inputs.
 */
export function subjectFromProfile(
  profile: GradeSubject,
  snapshot: GradeSnapshot,
): GradeSubject {
  const publicKey = keyOf(profile.publicKey);
  const ranked = snapshot.ranked.find((node) => node.publicKey === publicKey);
  if (!ranked) {
    return {
      publicKey,
      capacity: profile.capacity,
      channels: profile.channels,
      firstSeen: profile.firstSeen,
    };
  }
  return {
    publicKey,
    capacity: ranked.capacity,
    channels: ranked.channels,
    firstSeen: ranked.firstSeen > 0 ? ranked.firstSeen : profile.firstSeen,
  };
}

export function gradeNode(
  subject: GradeSubject,
  snapshot: GradeSnapshot,
  now: number,
): NodeGrade | null {
  const publicKey = keyOf(subject.publicKey);
  const capacity = capacityMark(
    subject.capacity,
    snapshot.liquidityRank[publicKey],
    snapshot.medCapacity,
  );
  const channels = channelMark(subject.channels, snapshot.avgChannels);
  const connectivity = connectivityMark(
    subject.channels,
    snapshot.connectivityRank[publicKey],
    snapshot.connectivityFloor,
  );
  const age = ageMark(subject.firstSeen, now);

  const parts: Array<{ key: GradeFactorKey; label: string; mark: { score: number; detail: string } }> = [];
  if (capacity) parts.push({ key: "capacity", label: "Capacity", mark: capacity });
  if (channels) parts.push({ key: "channels", label: "Channels", mark: channels });
  if (connectivity) parts.push({ key: "connectivity", label: "Connectivity", mark: connectivity });
  if (age) parts.push({ key: "age", label: "Age", mark: age });
  if (parts.length < 2) return null;

  const factors: GradeFactor[] = parts.map((part) => ({
    key: part.key,
    label: part.label,
    weight: GRADE_WEIGHTS[part.key],
    score: part.mark.score,
    detail: part.mark.detail,
  }));
  const weight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const score = clamp(
    Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / weight),
  );
  return { score, letter: letterFor(score), factors };
}

export function gradeForNode(
  profile: GradeSubject,
  snapshot: GradeSnapshot | null,
  now = Math.floor(Date.now() / 1000),
): NodeGrade | null {
  if (!snapshot) return null;
  return gradeNode(subjectFromProfile(profile, snapshot), snapshot, now);
}

export function topGraded(
  snapshot: GradeSnapshot,
  now: number,
  limit = TOP_GRADE_COUNT,
): Array<{ node: RankedNode; grade: NodeGrade }> {
  const rows: Array<{ node: RankedNode; grade: NodeGrade }> = [];
  for (const node of snapshot.ranked) {
    const grade = gradeNode(node, snapshot, now);
    if (!grade) continue;
    rows.push({ node, grade });
  }
  rows.sort(
    (a, b) =>
      b.grade.score - a.grade.score ||
      b.node.capacity - a.node.capacity ||
      a.node.publicKey.localeCompare(b.node.publicKey),
  );
  return rows.slice(0, Math.max(0, limit));
}

export type FeeMark = {
  medianPpm: number;
  networkMedianPpm: number;
  sampleSize: number;
  score: number;
};

export function median(values: number[]): number | null {
  const sorted = values.filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (left === undefined || right === undefined) return null;
  return (left + right) / 2;
}

export function feeMarkFromRates(
  rates: Array<number | null | undefined>,
  networkMedianPpm: number,
): FeeMark | null {
  if (!(networkMedianPpm > 0)) return null;
  const sample = rates.filter(
    (rate): rate is number => typeof rate === "number" && Number.isFinite(rate) && rate >= 0,
  );
  if (sample.length === 0) return null;
  const medianPpm = median(sample);
  if (medianPpm === null) return null;
  const score =
    medianPpm <= 0
      ? 0
      : clamp(Math.round(100 - 25 * Math.abs(Math.log2(medianPpm / networkMedianPpm))));
  return {
    medianPpm,
    networkMedianPpm,
    sampleSize: sample.length,
    score,
  };
}

export function gradeShareUrl(pubkey: string, site = "https://ln.fyi"): string {
  const root = site.replace(/\/$/, "");
  return `${root}/nodes/${keyOf(pubkey)}?ref=share`;
}

export function gradeShareText(alias: string, letter: string, score: number): string {
  const name = alias.replace(/\s+/g, " ").trim().slice(0, 40) || "This node";
  return `${name} scored ${letter} (${score}/100) on ln.fyi — a public Lightning node grade.`;
}

export function xIntentHref(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url }).toString()}`;
}
