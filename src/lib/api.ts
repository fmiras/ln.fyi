/**
 * mempool.space Lightning API client.
 * Docs: https://mempool.space/docs/api/rest
 * All endpoints are public and require no authentication.
 */

// Uses the emzy mirror — the primary mempool.space instance stopped updating
// its Lightning statistics endpoints in Jan 2026, while the mirror tracks live.
const BASE =
  process.env.NEXT_PUBLIC_MEMPOOL_BASE ?? "https://mempool.emzy.de/api/v1";

type Interval = "24h" | "3d" | "1w" | "1m" | "3m" | "6m" | "1y" | "2y" | "3y";

export type NetworkStats = {
  added: string | number;
  id: number;
  channel_count: number;
  node_count: number;
  total_capacity: number;
  tor_nodes: number;
  clearnet_nodes: number;
  unannounced_nodes: number;
  clearnet_tor_nodes: number;
  avg_capacity: number;
  avg_fee_rate: number;
  avg_base_fee_mtokens: number;
  med_capacity: number;
  med_fee_rate: number;
  med_base_fee_mtokens: number;
};

type LatestEnvelope = { latest: NetworkStats };

export type NetworkHistoryPoint = {
  added: number;
  channel_count: number;
  total_capacity: number;
  tor_nodes: number;
  clearnet_nodes: number;
  unannounced_nodes: number;
  clearnet_tor_nodes: number;
};

export type NodeRanking = {
  publicKey: string;
  alias: string;
  channels: number;
  capacity: number;
  firstSeen?: number;
  updatedAt?: number;
  city?: { en: string } | null;
  country?: { en: string } | null;
};

export type LiquidityRanking = {
  publicKey: string;
  alias: string;
  capacity: number;
  channels: number;
  firstSeen: number;
  updatedAt: number;
  city?: { en: string } | null;
  country?: { en: string } | null;
};

export type CountryStat = {
  iso: string;
  name: { en: string } & Record<string, string>;
  count: number;
  share: number;
  capacity: number;
};

export type IspStat = {
  ispId: string;
  name: string;
  numberChannels: number;
  numberNodes: number;
  capacity: number;
};

export type NodeDetail = {
  public_key: string;
  alias: string;
  first_seen: number;
  updated_at: number;
  color: string;
  sockets: string;
  as_number?: number;
  city_id?: number;
  country_id?: number;
  subdivision_id?: number;
  longitude?: number;
  latitude?: number;
  iso_code?: string;
  as_organization?: string;
  city?: { en: string } | Record<string, string> | null;
  country?: { en: string } | Record<string, string> | null;
  subdivision?: { en: string } | Record<string, string> | null;
  active_channel_count: number;
  capacity: number;
  opened_channel_count?: number;
  closed_channel_count?: number;
  features?: unknown[];
};

export type NodeStatsPoint = {
  added: number;
  capacity: number;
  channels: number;
};

export type ChannelListItem = {
  status: number; // 1 = open, 2 = closed
  closing_reason: number | null; // 1 coop · 2 force-local · 3 force-remote · 4 breach · null unknown
  closing_date: number | null;
  capacity: number;
  short_id: string; // "<blockHeight>x<txIndex>x<vout>"
  id: string;
  fee_rate: number;
  node: {
    alias: string;
    public_key: string;
    channels: number;
    capacity: string | number;
  };
};

async function j<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

// mempool.space's core chain endpoints live at /api (not /api/v1). BASE already
// includes /api/v1, so we strip the suffix to hit the chain namespace.
async function jRoot<T>(path: string, revalidate = 300): Promise<T> {
  const root = BASE.replace(/\/v1$/, "");
  const res = await fetch(`${root}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  latest: async (): Promise<NetworkStats> => {
    const env = await j<LatestEnvelope>("/lightning/statistics/latest", 120);
    return env.latest;
  },
  history: (interval: Interval = "1y") =>
    j<NetworkHistoryPoint[]>(`/lightning/statistics/${interval}`, 600),
  topByCapacity: () =>
    j<LiquidityRanking[]>("/lightning/nodes/rankings/liquidity", 600),
  topByConnectivity: () =>
    j<NodeRanking[]>("/lightning/nodes/rankings/connectivity", 600),
  oldest: () => j<NodeRanking[]>("/lightning/nodes/rankings/age", 600),
  countries: async (): Promise<CountryStat[]> => {
    const raw = await j<Array<CountryStat & { capacity: string | number }>>(
      "/lightning/nodes/countries",
      3600,
    );
    // capacity comes back as a string — coerce to number
    return raw.map((c) => ({ ...c, capacity: Number(c.capacity) || 0 }));
  },
  isps: () =>
    j<{
      clearnetCapacity: number;
      torCapacity: number;
      unknownCapacity: number;
      ispRanking: [string, string, number, number, number][];
    }>("/lightning/nodes/isp-ranking", 3600),
  node: (pubKey: string) => j<NodeDetail>(`/lightning/nodes/${pubKey}`, 600),
  nodeStats: (pubKey: string) =>
    j<NodeStatsPoint[]>(`/lightning/nodes/${pubKey}/statistics`, 600),
  nodeChannels: (
    pubKey: string,
    status: "open" | "closed",
    index = 0,
  ): Promise<ChannelListItem[]> =>
    j<ChannelListItem[]>(
      `/lightning/channels?public_key=${pubKey}&status=${status}&index=${index}`,
      300,
    ),
  tipHeight: async (): Promise<number> => {
    const v = await jRoot<number | string>("/blocks/tip/height", 60);
    return typeof v === "number" ? v : parseInt(v, 10);
  },
};

// Formatting helpers — all data uses tabular-nums + mono.

export function formatSats(sats: number): string {
  // Returns BTC with 2 decimal thousand-separated.
  const btc = sats / 1e8;
  if (btc >= 1000) return btc.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (btc >= 1) return btc.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return btc.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function formatBtc(sats: number): string {
  return `₿ ${formatSats(sats)}`;
}

export function compactNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toString();
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

export function shortKey(pk: string): string {
  if (!pk) return "";
  return `${pk.slice(0, 8)}…${pk.slice(-6)}`;
}

export function relTime(unix: number): string {
  const now = Date.now() / 1000;
  const diff = now - unix;
  const days = Math.floor(diff / 86400);
  if (days < 1) return "today";
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

export function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function pctChange(current: number, prior: number): number {
  if (!prior) return 0;
  return ((current - prior) / prior) * 100;
}

// Fallback fetcher that tolerates upstream outages — returns null on failure
export async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.warn("api fallback:", (e as Error).message);
    return null;
  }
}
