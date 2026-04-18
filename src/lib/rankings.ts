import { cache } from "react";
import {
  api,
  safe,
  type LiquidityRanking,
  type NodeDetail,
  type NodeRanking,
} from "./api";
import { slugify } from "./seo";

export type EnrichedNode = LiquidityRanking & {
  detail: NodeDetail | null;
};

/**
 * Fetch the top-liquidity ranking and, in parallel, each node's full detail.
 * Used to power country and ISP pages that need AS/country info that the
 * ranking endpoint doesn't return on its own.
 *
 * Wrapped in React.cache so repeated calls within the same render tree
 * reuse the same promise. Underlying fetch calls also hit Next's fetch
 * cache, so the cost is one round-trip per pubkey per revalidation window
 * even when hundreds of pages are generated in the same build.
 */
export const topLiquidityWithDetails = cache(
  async (limit = 100): Promise<EnrichedNode[]> => {
    const top = await safe(api.topByCapacity());
    if (!top) return [];
    const slice = top.slice(0, limit);
    const details = await Promise.all(
      slice.map((n) => safe(api.node(n.publicKey))),
    );
    return slice.map((n, i) => ({ ...n, detail: details[i] }));
  },
);

export function countryIsoOf(n: EnrichedNode): string | null {
  return n.detail?.iso_code?.toLowerCase() ?? null;
}

export function ispAsOrgOf(n: EnrichedNode): string | null {
  return n.detail?.as_organization ?? null;
}

export function asNumberOf(n: EnrichedNode): number | null {
  return n.detail?.as_number ?? null;
}

export type AliasMatch = {
  pubkey: string;
  alias: string;
  capacity: number;
  channels: number;
};

/**
 * Slug-keyed index of node aliases across all three ranking endpoints.
 * Used to resolve human-friendly URLs like /n/binance to the underlying
 * pubkey. Multiple nodes can share an alias; entries are sorted so the
 * highest-capacity match is first.
 */
export const aliasIndex = cache(async (): Promise<Map<string, AliasMatch[]>> => {
  const [liq, conn, old] = await Promise.all([
    safe(api.topByCapacity()),
    safe(api.topByConnectivity()),
    safe(api.oldest()),
  ]);
  const byPk = new Map<string, AliasMatch>();
  const push = (n: LiquidityRanking | NodeRanking) => {
    if (!n.publicKey || !n.alias) return;
    const prev = byPk.get(n.publicKey);
    if (prev) {
      // Some endpoints have richer data — keep the max-capacity entry
      if (n.capacity > prev.capacity) {
        byPk.set(n.publicKey, {
          pubkey: n.publicKey,
          alias: n.alias,
          capacity: n.capacity,
          channels: n.channels,
        });
      }
    } else {
      byPk.set(n.publicKey, {
        pubkey: n.publicKey,
        alias: n.alias,
        capacity: n.capacity,
        channels: n.channels,
      });
    }
  };
  for (const list of [liq, conn, old]) {
    if (!list) continue;
    for (const n of list) push(n);
  }
  const bySlug = new Map<string, AliasMatch[]>();
  for (const match of byPk.values()) {
    const slug = slugify(match.alias);
    if (!slug) continue;
    const bucket = bySlug.get(slug);
    if (bucket) bucket.push(match);
    else bySlug.set(slug, [match]);
  }
  for (const bucket of bySlug.values()) {
    bucket.sort((a, b) => b.capacity - a.capacity);
  }
  return bySlug;
});
