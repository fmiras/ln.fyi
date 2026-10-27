// Pure weekly-change math. History points come from mempool's per-node
// statistics (daily capacity and channel counts). Rank history is not in
// that payload.

export const WEEK_SECONDS = 7 * 86_400;
export const WEEK_TOLERANCE_SECONDS = 2 * 86_400;

export const MOVERS_LIQUIDITY_LIMIT = 10;
export const MOVERS_CONNECTIVITY_LIMIT = 10;
export const MOVERS_COHORT_MAX = 16;

export type SnapshotPoint = {
  added: number;
  capacity: number;
  channels: number;
};

export type WeekDelta = {
  latest: SnapshotPoint;
  prior: SnapshotPoint;
  capacityDelta: number;
  channelDelta: number;
};

export function weeklySnapshotDelta(points: SnapshotPoint[]): WeekDelta | null {
  const sorted = points
    .filter((point) => Number.isFinite(point.added) && Number.isFinite(point.capacity) && Number.isFinite(point.channels))
    .sort((a, b) => a.added - b.added);
  if (sorted.length < 2) return null;
  const latest = sorted[sorted.length - 1];
  const target = latest.added - WEEK_SECONDS;
  let prior: SnapshotPoint | null = null;
  for (const point of sorted) {
    if (point.added <= target) prior = point;
    else break;
  }
  if (!prior) return null;
  if (target - prior.added > WEEK_TOLERANCE_SECONDS) return null;
  return {
    latest,
    prior,
    capacityDelta: latest.capacity - prior.capacity,
    channelDelta: latest.channels - prior.channels,
  };
}

export function selectCohort<T extends { publicKey: string }>(
  liquidity: T[],
  connectivity: T[],
  limits: { liquidity: number; connectivity: number; max: number } = {
    liquidity: MOVERS_LIQUIDITY_LIMIT,
    connectivity: MOVERS_CONNECTIVITY_LIMIT,
    max: MOVERS_COHORT_MAX,
  },
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  const push = (node: T | undefined) => {
    if (!node?.publicKey || out.length >= limits.max) return;
    const key = node.publicKey.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(node);
  };
  const byLiquidity = liquidity.slice(0, limits.liquidity);
  const byConnectivity = connectivity.slice(0, limits.connectivity);
  const rows = Math.max(byLiquidity.length, byConnectivity.length);
  for (let i = 0; i < rows; i++) {
    push(byLiquidity[i]);
    push(byConnectivity[i]);
  }
  return out;
}

export function extremesBy<T>(
  items: T[],
  value: (item: T) => number,
  limit: number,
): { gainers: T[]; losers: T[] } {
  const gainers = items
    .filter((item) => value(item) > 0)
    .sort((a, b) => value(b) - value(a) || stableKey(a).localeCompare(stableKey(b)))
    .slice(0, limit);
  const losers = items
    .filter((item) => value(item) < 0)
    .sort((a, b) => value(a) - value(b) || stableKey(a).localeCompare(stableKey(b)))
    .slice(0, limit);
  return { gainers, losers };
}

function stableKey(item: unknown): string {
  if (item && typeof item === "object" && "pubkey" in item && typeof item.pubkey === "string") {
    return item.pubkey;
  }
  return "";
}
