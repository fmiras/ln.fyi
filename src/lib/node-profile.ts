import { cache } from "react";
import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ambossNode, type AmbossNode } from "./amboss";
import {
  api,
  getLightning,
  safe,
  type ChannelListItem,
  type NodeDetail,
  type NodeStatsPoint,
} from "./api";
import {
  isLightningPubkey,
  mempoolProviderBases,
  nodePageDecision,
  resolveNodeDetail,
  UpstreamError,
} from "./upstream";

export type NodeProfile =
  | { status: "not-found" }
  | {
      status: "ready";
      source: "primary" | "fallback";
      node: NodeDetail;
      stats: NodeStatsPoint[] | null;
      tip: number | null;
      opens: ChannelListItem[] | null;
      closes: ChannelListItem[] | null;
      amboss: AmbossNode | null;
    };

const DAY = 86_400;
const FALLBACK_TTL = 600;

async function loadFromBases(
  pubkey: string,
  bases: string[],
  revalidate: number,
  source: "primary" | "fallback",
): Promise<NodeProfile> {
  if (!isLightningPubkey(pubkey)) return { status: "not-found" };
  const encoded = encodeURIComponent(pubkey);
  try {
    const [node, stats, tip, opens, closes, amboss] = await Promise.all([
      resolveNodeDetail<NodeDetail>(pubkey, { bases, revalidate }),
      safe(getLightning<NodeStatsPoint[]>(`/lightning/nodes/${encoded}/statistics`, revalidate, bases)),
      safe(api.tipHeight()),
      safe(
        getLightning<ChannelListItem[]>(
          `/lightning/channels?public_key=${encoded}&status=open&index=0`,
          revalidate,
          bases,
        ),
      ),
      safe(
        getLightning<ChannelListItem[]>(
          `/lightning/channels?public_key=${encoded}&status=closed&index=0`,
          revalidate,
          bases,
        ),
      ),
      ambossNode(pubkey),
    ]);
    return { status: "ready", source, node, stats, tip, opens, closes, amboss };
  } catch (err) {
    if (nodePageDecision(pubkey, err) === "not-found") return { status: "not-found" };
    throw err;
  }
}

const loadPrimaryCached = unstable_cache(
  async (pubkey: string) => {
    const [primary] = mempoolProviderBases();
    if (!primary) throw new UpstreamError("no mempool provider configured");
    return loadFromBases(pubkey, [primary], DAY, "primary");
  },
  ["node-profile-primary-v1"],
  { revalidate: DAY },
);

const loadFallbackCached = unstable_cache(
  async (pubkey: string) => {
    const fallbacks = mempoolProviderBases().slice(1);
    if (fallbacks.length === 0) throw new UpstreamError("no fallback provider");
    return loadFromBases(pubkey, fallbacks, FALLBACK_TTL, "fallback");
  },
  ["node-profile-fallback-v1"],
  { revalidate: FALLBACK_TTL },
);

/**
 * Shorten this response's ISR lifetime. Next uses the minimum fetch
 * revalidate on the route, and it records that value before the origin
 * answers, so a reserved name that fails closed still caps the cache.
 */
export async function capRouteRevalidate(seconds: number): Promise<void> {
  try {
    await fetch(`https://revalidate-cap.invalid/${seconds}`, {
      next: { revalidate: seconds },
      signal: AbortSignal.timeout(300),
    });
  } catch {
    // The host is reserved and never resolves. The cache window is what matters.
  }
}

/**
 * One node profile per request, shared by generateMetadata and the page.
 * A fresh primary hit is cached for a day. If that host is down and an older
 * primary payload exists, it is reused and the backup is not consulted.
 * A cold miss falls through to the backup provider for ten minutes. Total
 * failure throws so the caller can render a one-minute fallback without
 * replacing a page that already cached successfully.
 */
export const loadNodeProfile = cache(async (pubkeyRaw: string): Promise<NodeProfile> => {
  const pubkey = pubkeyRaw.toLowerCase();
  if (!isLightningPubkey(pubkey)) return { status: "not-found" };

  try {
    const primary = await loadPrimaryCached(pubkey);
    if (primary.status === "not-found") return primary;
    return primary;
  } catch (err) {
    unstable_rethrow(err);
    if (mempoolProviderBases().length < 2) throw err;
    try {
      const fallback = await loadFallbackCached(pubkey);
      if (fallback.status === "not-found") throw err;
      await capRouteRevalidate(FALLBACK_TTL);
      return fallback;
    } catch (fallbackErr) {
      unstable_rethrow(fallbackErr);
      throw err;
    }
  }
});
