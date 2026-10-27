import { ambossRankLists, type AmbossRankRow } from "./amboss";
import { getLightning, safe, shortKey, type NodeStatsPoint } from "./api";
import { loadDailyRankings } from "./directory";
import { extremesBy, selectCohort, weeklySnapshotDelta } from "./movers";

const DAY = 86_400;
const STATS_CONCURRENCY = 3;
const STATS_DEADLINE_MS = 8_000;
const LIST_LIMIT = 6;

export type MoverRow = {
  pubkey: string;
  alias: string;
  capacitySats: number;
  channels: number;
  capacityDelta: number | null;
  channelDelta: number | null;
  capacityRank: number | null;
  connectivityRank: number | null;
  capacityRankChange: number | null;
  connectivityRankChange: number | null;
};

export type MoverSplit = { gainers: MoverRow[]; losers: MoverRow[] };

export type MoversReport = {
  degraded: boolean;
  partialStats: boolean;
  cohortSize: number;
  statsRead: number;
  capacity: MoverSplit;
  channels: MoverSplit;
  capacityRank: MoverSplit;
  connectivityRank: MoverSplit;
  flatCapacityRanks: number;
  flatConnectivityRanks: number;
  notes: string[];
};

type KnownNode = {
  pubkey: string;
  alias: string;
  capacitySats: number;
  channels: number;
  capacityRank: number | null;
  connectivityRank: number | null;
};

const EMPTY_SPLIT: MoverSplit = { gainers: [], losers: [] };

let inflight: Promise<MoversReport> | null = null;

export function loadMovers(): Promise<MoversReport> {
  if (!inflight) {
    inflight = computeMovers().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function computeMovers(): Promise<MoversReport> {
  try {
    const [rankings, amboss] = await Promise.all([loadDailyRankings(), ambossRankLists()]);
    if (!rankings) return emptyReport(true, ["The Lightning directory did not answer, so this week’s movers were not built."]);

    const known = indexRankings(rankings.liquidity, rankings.connectivity);
    const cohort = selectCohort(rankings.liquidity, rankings.connectivity);
    const stats = await mapPool(cohort, STATS_CONCURRENCY, STATS_DEADLINE_MS, (node) =>
      safe(
        getLightning<NodeStatsPoint[]>(
          `/lightning/nodes/${encodeURIComponent(node.publicKey)}/statistics`,
          DAY,
        ),
      ),
    );

    const measured: MoverRow[] = [];
    let statsRead = 0;
    cohort.forEach((node, index) => {
      const series = stats[index];
      if (!series) return;
      statsRead += 1;
      const delta = weeklySnapshotDelta(series);
      if (!delta) return;
      const info = known.get(node.publicKey.toLowerCase());
      measured.push({
        pubkey: node.publicKey,
        alias: (node.alias || info?.alias || "Anonymous").trim() || "Anonymous",
        capacitySats: delta.latest.capacity,
        channels: delta.latest.channels,
        capacityDelta: delta.capacityDelta,
        channelDelta: delta.channelDelta,
        capacityRank: info?.capacityRank ?? null,
        connectivityRank: info?.connectivityRank ?? null,
        capacityRankChange: null,
        connectivityRankChange: null,
      });
    });

    const capacityRankRows = rankRows(amboss?.capacity, known, "capacity");
    const connectivityRankRows = rankRows(amboss?.channels, known, "connectivity");
    const partialStats = cohort.length > 0 && statsRead < cohort.length;
    const notes = [
      "Capacity and channel changes compare mempool’s newest daily snapshot with the one about seven days earlier, for a capped set of liquidity and connectivity leaders. Each series is the same statistics call a node profile already caches for a day.",
      "Rank change is Amboss’s weekly figure for its published top lists. A positive number means the node moved up. Mempool does not publish historical rank, and this site does not store past rankings.",
    ];
    if (partialStats) {
      notes.push(
        `Histories arrived for ${statsRead} of ${cohort.length} tracked nodes. The rest are skipped until the next refresh rather than retried in a burst.`,
      );
    }
    if (!amboss) {
      notes.push("Amboss rank changes were unavailable for this refresh, so the rank lists are empty.");
    }

    return {
      degraded: false,
      partialStats,
      cohortSize: cohort.length,
      statsRead,
      capacity: extremesBy(measured, (row) => row.capacityDelta ?? 0, LIST_LIMIT),
      channels: extremesBy(measured, (row) => row.channelDelta ?? 0, LIST_LIMIT),
      capacityRank: extremesBy(capacityRankRows, (row) => row.capacityRankChange ?? 0, LIST_LIMIT),
      connectivityRank: extremesBy(
        connectivityRankRows,
        (row) => row.connectivityRankChange ?? 0,
        LIST_LIMIT,
      ),
      flatCapacityRanks: (amboss?.capacity ?? []).filter((row) => row.week === 0).length,
      flatConnectivityRanks: (amboss?.channels ?? []).filter((row) => row.week === 0).length,
      notes,
    };
  } catch (err) {
    console.warn("movers unavailable:", err instanceof Error ? err.message : err);
    return emptyReport(true, ["The weekly mover lists could not be built from the public directory."]);
  }
}

function emptyReport(degraded: boolean, notes: string[]): MoversReport {
  return {
    degraded,
    partialStats: false,
    cohortSize: 0,
    statsRead: 0,
    capacity: EMPTY_SPLIT,
    channels: EMPTY_SPLIT,
    capacityRank: EMPTY_SPLIT,
    connectivityRank: EMPTY_SPLIT,
    flatCapacityRanks: 0,
    flatConnectivityRanks: 0,
    notes,
  };
}

function indexRankings(
  liquidity: { publicKey: string; alias: string; capacity: number; channels: number }[],
  connectivity: { publicKey: string; alias: string; capacity: number; channels: number }[],
): Map<string, KnownNode> {
  const map = new Map<string, KnownNode>();
  liquidity.forEach((node, index) => {
    const key = node.publicKey?.toLowerCase();
    if (!key) return;
    map.set(key, {
      pubkey: node.publicKey,
      alias: node.alias || "Anonymous",
      capacitySats: node.capacity,
      channels: node.channels,
      capacityRank: index + 1,
      connectivityRank: null,
    });
  });
  connectivity.forEach((node, index) => {
    const key = node.publicKey?.toLowerCase();
    if (!key) return;
    const prev = map.get(key);
    if (prev) {
      prev.connectivityRank = index + 1;
      if (node.channels) prev.channels = node.channels;
      return;
    }
    map.set(key, {
      pubkey: node.publicKey,
      alias: node.alias || "Anonymous",
      capacitySats: node.capacity,
      channels: node.channels,
      capacityRank: null,
      connectivityRank: index + 1,
    });
  });
  return map;
}

function rankRows(
  entries: AmbossRankRow[] | undefined,
  known: Map<string, KnownNode>,
  board: "capacity" | "connectivity",
): MoverRow[] {
  return (entries ?? []).map((entry) => {
    const info = known.get(entry.pubkey.toLowerCase());
    return {
      pubkey: entry.pubkey,
      alias: info?.alias || shortKey(entry.pubkey),
      capacitySats: info?.capacitySats ?? 0,
      channels: info?.channels ?? 0,
      capacityDelta: null,
      channelDelta: null,
      capacityRank: board === "capacity" ? entry.rank : (info?.capacityRank ?? null),
      connectivityRank: board === "connectivity" ? entry.rank : (info?.connectivityRank ?? null),
      capacityRankChange: board === "capacity" ? entry.week : null,
      connectivityRankChange: board === "connectivity" ? entry.week : null,
    };
  });
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  deadlineMs: number,
  fn: (item: T) => Promise<R>,
): Promise<Array<R | undefined>> {
  const out: Array<R | undefined> = new Array(items.length);
  let cursor = 0;
  const started = Date.now();
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (Date.now() - started < deadlineMs) {
      const index = cursor++;
      if (index >= items.length) return;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}
