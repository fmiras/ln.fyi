// Pure Lightning node report card. Inputs are plain numbers already loaded
// for a profile (plus optional ranks). Nothing here touches the network.

export const GRADE_WEIGHTS = {
  capacity: 20,
  channels: 15,
  connectivity: 20,
  fees: 15,
  age: 15,
  presence: 15,
} as const;

export const LETTER_BANDS: { letter: string; min: number }[] = [
  { letter: "A+", min: 97 },
  { letter: "A", min: 93 },
  { letter: "A-", min: 90 },
  { letter: "B+", min: 87 },
  { letter: "B", min: 83 },
  { letter: "B-", min: 80 },
  { letter: "C+", min: 77 },
  { letter: "C", min: 73 },
  { letter: "C-", min: 70 },
  { letter: "D", min: 60 },
  { letter: "F", min: 0 },
];

const RULES = {
  capacity:
    "Log scale: 0.05 BTC is low, 1 BTC is middling, 10 BTC is strong, 50 BTC is nearly full marks.",
  channels:
    "A handful of channels is a personal node. 30 is strong. 200 or more is a hub.",
  connectivity:
    "Top-100 channel rank, plus peer quality and a clearnet or Tor socket. Unranked stays modest so channel count is not scored twice.",
  fees:
    "Median ppm on the first page of open channels (at most 10). 1–150 ppm scores highest. No sample is a neutral 60.",
  age:
    "Years since first seen. One year is established. Four years is full marks. A missing date is a neutral 60.",
  presence:
    "Share of recent daily snapshots where the node still had public channels. Announced presence, not an internal uptime probe.",
} as const;

export type GradeFactorId = keyof typeof GRADE_WEIGHTS;

export type GradeFactor = {
  id: GradeFactorId;
  label: string;
  score: number;
  weight: number;
  known: boolean;
  detail: string;
  rule: string;
};

export type NodeGrade = {
  score: number;
  letter: string;
  summary: string;
  factors: GradeFactor[];
};

export type HistoryPoint = {
  added: number;
  capacity: number;
  channels: number;
};

export type GradeInput = {
  capacitySats: number;
  activeChannels: number;
  firstSeen: number | null;
  updatedAt: number | null;
  now: number;
  clearnetSockets: number;
  torSockets: number;
  feeRatesPpm: number[];
  peerChannelCounts: number[];
  history: HistoryPoint[];
  /** 1-based position in the published top 100, or null when absent. */
  capacityRank: number | null;
  connectivityRank: number | null;
};

const DAY = 86_400;

export function letterGrade(score: number): string {
  const rounded = clamp(Math.round(score));
  for (const band of LETTER_BANDS) {
    if (rounded >= band.min) return band.letter;
  }
  return "F";
}

export function scoreCapacity(sats: number): number {
  if (!Number.isFinite(sats) || sats <= 0) return 5;
  const btc = sats / 1e8;
  if (btc < 0.01) return 18;
  if (btc < 0.05) return 32;
  if (btc < 0.2) return 48;
  if (btc < 0.5) return 58;
  if (btc < 1) return 66;
  if (btc < 2) return 74;
  if (btc < 5) return 82;
  if (btc < 10) return 88;
  if (btc < 25) return 93;
  if (btc < 50) return 96;
  return 100;
}

export function scoreChannels(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 8;
  if (count === 1) return 22;
  if (count <= 4) return 40;
  if (count <= 12) return 58;
  if (count <= 30) return 72;
  if (count <= 80) return 84;
  if (count <= 200) return 93;
  return 100;
}

export function scoreRank(rank: number): number {
  if (rank <= 1) return 100;
  if (rank <= 3) return 97;
  if (rank <= 10) return 93;
  if (rank <= 25) return 84;
  if (rank <= 50) return 74;
  if (rank <= 100) return 64;
  return 55;
}

export function median(values: number[]): number | null {
  const xs = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  if (xs.length % 2) return xs[mid];
  return (xs[mid - 1] + xs[mid]) / 2;
}

export function scoreFeeMedian(ppm: number): number {
  if (ppm <= 0) return 78;
  if (ppm <= 50) return 100;
  if (ppm <= 150) return 92;
  if (ppm <= 400) return 80;
  if (ppm <= 1000) return 62;
  if (ppm <= 2500) return 40;
  return 22;
}

export function scoreAge(
  firstSeen: number | null,
  now: number,
): { score: number; known: boolean; days: number | null } {
  if (!firstSeen || !Number.isFinite(firstSeen) || firstSeen <= 0 || firstSeen > now) {
    return { score: 60, known: false, days: null };
  }
  const days = (now - firstSeen) / DAY;
  let score = 30;
  if (days >= 30) score = 48;
  if (days >= 180) score = 64;
  if (days >= 365) score = 76;
  if (days >= 365 * 2) score = 86;
  if (days >= 365 * 4) score = 94;
  if (days >= 365 * 5.5) score = 100;
  return { score, known: true, days };
}

/**
 * Presence over the last 30 UTC days ending at the newest snapshot, or over
 * the node's whole series when that series is shorter than 30 days.
 */
export function scorePresence(history: HistoryPoint[]): {
  score: number;
  known: boolean;
  present: number;
  expected: number;
} {
  const points = history.filter((p) => Number.isFinite(p.added));
  if (!points.length) return { score: 60, known: false, present: 0, expected: 30 };
  let latest = points[0].added;
  let earliest = points[0].added;
  for (const point of points) {
    if (point.added > latest) latest = point.added;
    if (point.added < earliest) earliest = point.added;
  }
  const endDay = Math.floor(latest / DAY);
  const startDay = Math.max(Math.floor(earliest / DAY), endDay - 29);
  const expected = endDay - startDay + 1;
  const days = new Set<number>();
  for (const point of points) {
    const day = Math.floor(point.added / DAY);
    if (day < startDay || day > endDay) continue;
    if (point.channels > 0 || point.capacity > 0) days.add(day);
  }
  const present = days.size;
  const score = clamp(Math.round((present / expected) * 100));
  return { score, known: true, present, expected };
}

export function scoreConnectivity(input: {
  rank: number | null;
  activeChannels: number;
  peerChannelCounts: number[];
  clearnetSockets: number;
  torSockets: number;
}): number {
  const ranked = input.rank != null && input.rank > 0;
  let score = ranked
    ? scoreRank(input.rank as number)
    : Math.min(58, scoreChannels(input.activeChannels) * 0.55);
  const peerMedian = median(input.peerChannelCounts);
  if (peerMedian != null) {
    if (peerMedian >= 80) score += 8;
    else if (peerMedian >= 30) score += 4;
    else if (peerMedian < 8) score -= 6;
  }
  const sockets = input.clearnetSockets + input.torSockets;
  if (sockets === 0 && input.activeChannels === 0) score -= 15;
  else if (input.clearnetSockets > 0 && input.torSockets > 0) score += 4;
  return clamp(score);
}

export function gradeNode(input: GradeInput): NodeGrade {
  const capacityScore = scoreCapacity(input.capacitySats);
  const channelScore = scoreChannels(input.activeChannels);
  const connectivityScore = scoreConnectivity({
    rank: input.connectivityRank,
    activeChannels: input.activeChannels,
    peerChannelCounts: input.peerChannelCounts,
    clearnetSockets: input.clearnetSockets,
    torSockets: input.torSockets,
  });
  const feeMedian = median(input.feeRatesPpm);
  const feesKnown = feeMedian != null;
  const feeScore = feesKnown ? scoreFeeMedian(feeMedian) : 60;
  const age = scoreAge(input.firstSeen, input.now);
  const presence = scorePresence(input.history);

  const factors: GradeFactor[] = [
    {
      id: "capacity",
      label: "Capacity",
      score: capacityScore,
      weight: GRADE_WEIGHTS.capacity,
      known: true,
      detail: `${btcLabel(input.capacitySats)} BTC public capacity${
        input.capacityRank ? `, liquidity rank #${input.capacityRank}` : ""
      }.`,
      rule: RULES.capacity,
    },
    {
      id: "channels",
      label: "Channels",
      score: channelScore,
      weight: GRADE_WEIGHTS.channels,
      known: true,
      detail: `${formatInt(input.activeChannels)} active public channels.`,
      rule: RULES.channels,
    },
    {
      id: "connectivity",
      label: "Connectivity",
      score: connectivityScore,
      weight: GRADE_WEIGHTS.connectivity,
      known: true,
      detail: connectivityDetail(input),
      rule: RULES.connectivity,
    },
    {
      id: "fees",
      label: "Fees",
      score: feeScore,
      weight: GRADE_WEIGHTS.fees,
      known: feesKnown,
      detail: feesKnown
        ? `Median ${formatPpm(feeMedian)} ppm across ${formatInt(input.feeRatesPpm.length)} sampled channels.`
        : "No open-channel fee sample, so this factor stays a neutral 60.",
      rule: RULES.fees,
    },
    {
      id: "age",
      label: "Age",
      score: age.score,
      weight: GRADE_WEIGHTS.age,
      known: age.known,
      detail: age.known
        ? `First seen ${utcDate(input.firstSeen as number)} (${yearsLabel(age.days as number)}).`
        : "No first-seen date, so age stays a neutral 60.",
      rule: RULES.age,
    },
    {
      id: "presence",
      label: "Presence",
      score: presence.score,
      weight: GRADE_WEIGHTS.presence,
      known: presence.known,
      detail: presence.known
        ? `Announced on ${formatInt(presence.present)} of ${formatInt(presence.expected)} daily snapshots${
            presence.expected < 30 ? " since it appeared" : ""
          }.${
            input.updatedAt
              ? ` Directory touched it ${utcDate(input.updatedAt)}.`
              : ""
          }`
        : "No daily history yet, so presence stays a neutral 60.",
      rule: RULES.presence,
    },
  ];

  const total = factors.reduce((sum, factor) => sum + (factor.score * factor.weight) / 100, 0);
  const score = clamp(Math.round(total));
  const letter = letterGrade(score);
  return { score, letter, summary: summarize(letter, factors), factors };
}

function connectivityDetail(input: GradeInput): string {
  const sockets = [
    input.clearnetSockets > 0 ? "clearnet" : null,
    input.torSockets > 0 ? "Tor" : null,
  ].filter(Boolean);
  const reach = sockets.length ? `Reachable via ${sockets.join(" and ")}.` : "No public socket in the directory.";
  const peerMedian = median(input.peerChannelCounts);
  const peers =
    peerMedian == null
      ? ""
      : ` Sampled peers have a median of ${formatInt(Math.round(peerMedian))} channels.`;
  if (input.connectivityRank) {
    return `Connectivity rank #${input.connectivityRank} of the published top 100. ${reach}${peers}`;
  }
  return `Outside the published top 100. ${reach}${peers}`;
}

function summarize(letter: string, factors: GradeFactor[]): string {
  const pool = factors.some((factor) => factor.known)
    ? factors.filter((factor) => factor.known)
    : factors;
  const best = pool.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = pool.reduce((a, b) => (b.score < a.score ? b : a));
  if (best.id === worst.id) {
    return `${letter} · even across the scored signals.`;
  }
  return `${letter} · strongest in ${best.label.toLowerCase()} (${best.score}), lightest on ${worst.label.toLowerCase()} (${worst.score}).`;
}

function clamp(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function formatPpm(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function btcLabel(sats: number): string {
  const btc = sats / 1e8;
  if (!Number.isFinite(btc)) return "0";
  if (Math.abs(btc) >= 100) return btc.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Math.abs(btc) >= 1) {
    return btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return btc.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function yearsLabel(days: number): string {
  const years = days / 365.25;
  if (years < 1) {
    const months = Math.max(1, Math.round(days / 30.4));
    return `${months}mo`;
  }
  const digits = years >= 10 ? 0 : 1;
  return `${years.toFixed(digits)}y`;
}

function utcDate(unix: number): string {
  const date = new Date(unix * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function gradeTone(letter: string): "good" | "paper" | "amber" | "bad" {
  if (letter.startsWith("A")) return "good";
  if (letter.startsWith("B")) return "paper";
  if (letter.startsWith("C") || letter.startsWith("D")) return "amber";
  return "bad";
}
