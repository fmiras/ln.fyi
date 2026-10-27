import { cache } from "react";
import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  getLightning,
  type LiquidityRanking,
  type NetworkStats,
  type NodeRanking,
} from "./api";
import { buildGradeSnapshot, type GradeSnapshot } from "./grade";
import { mempoolProviderBases } from "./upstream";

const DAY = 86_400;

async function readList<T>(path: string, primary: string): Promise<T | null> {
  try {
    return await getLightning<T>(path, DAY, [primary]);
  } catch (err) {
    console.warn(
      "grade snapshot:",
      path,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * One daily snapshot from the primary directory only. mempool.space is the
 * failover for node pages, but its Lightning rankings lag, so a grade does
 * not fall through to it. The callback throws when both ranking lists miss,
 * and unstable_cache does not store that failure. Inner fetches run inside
 * unstable_cache, so a shorter failover revalidate cannot pull /nodes/[pubkey]
 * below its day-long ISR.
 */
async function readGradeSnapshot(): Promise<GradeSnapshot> {
  const [primary] = mempoolProviderBases();
  if (!primary) throw new Error("no mempool provider configured");
  const [liquidity, connectivity, age, latest] = await Promise.all([
    readList<LiquidityRanking[]>("/lightning/nodes/rankings/liquidity", primary),
    readList<NodeRanking[]>("/lightning/nodes/rankings/connectivity", primary),
    readList<NodeRanking[]>("/lightning/nodes/rankings/age", primary),
    readList<{ latest?: NetworkStats }>("/lightning/statistics/latest", primary),
  ]);
  if (!liquidity?.length && !connectivity?.length) {
    throw new Error("grade rankings unavailable");
  }
  const stats = latest?.latest;
  return buildGradeSnapshot({
    liquidity,
    connectivity,
    age,
    medCapacity: stats?.med_capacity ?? 0,
    nodeCount: stats?.node_count ?? 0,
    channelCount: stats?.channel_count ?? 0,
    medFeeRate: stats?.med_fee_rate ?? 0,
  });
}

const loadGradeSnapshot = unstable_cache(readGradeSnapshot, ["grade-snapshot-v1"], {
  revalidate: DAY,
});

export const getGradeSnapshot = cache(async (): Promise<GradeSnapshot | null> => {
  try {
    return await loadGradeSnapshot();
  } catch (err) {
    unstable_rethrow(err);
    console.warn(
      "grade snapshot unavailable:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
});
