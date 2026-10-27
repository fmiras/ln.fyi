import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getLightning, type LiquidityRanking, type NodeRanking } from "./api";

// A day, matching /nodes/[pubkey]. A shorter fetch here would shrink that
// route's ISR, because Next uses the lowest revalidate on the route.
const DAY = 86_400;

export type DailyRankings = {
  liquidity: LiquidityRanking[];
  connectivity: NodeRanking[];
};

const cachedRankings = unstable_cache(
  async (): Promise<DailyRankings> => {
    const [liquidity, connectivity] = await Promise.all([
      getLightning<LiquidityRanking[]>("/lightning/nodes/rankings/liquidity", DAY),
      getLightning<NodeRanking[]>("/lightning/nodes/rankings/connectivity", DAY),
    ]);
    return { liquidity, connectivity };
  },
  ["daily-rankings-v1"],
  { revalidate: DAY },
);

export async function loadDailyRankings(): Promise<DailyRankings | null> {
  try {
    return await cachedRankings();
  } catch (err) {
    unstable_rethrow(err);
    console.warn("daily rankings unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** 1-based rank in a published list, or null when the pubkey is outside it. */
export function rankOf(
  list: { publicKey: string }[] | null | undefined,
  pubkey: string,
): number | null {
  if (!list?.length || !pubkey) return null;
  const key = pubkey.toLowerCase();
  const index = list.findIndex((node) => node.publicKey?.toLowerCase() === key);
  return index >= 0 ? index + 1 : null;
}
