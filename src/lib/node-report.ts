import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { loadDailyRankings, rankOf, type DailyRankings } from "./directory";
import { gradeNode, type GradeInput, type NodeGrade } from "./grade";
import { loadNodeProfile, type NodeProfile } from "./node-profile";

export function gradeFromProfile(
  profile: Extract<NodeProfile, { status: "ready" }>,
  rankings: DailyRankings | null,
  now = Math.floor(Date.now() / 1000),
): NodeGrade {
  const node = profile.node;
  const sockets = node.sockets
    ? node.sockets
        .split(",")
        .map((socket) => socket.trim())
        .filter(Boolean)
    : [];
  const opens = profile.opens ?? [];
  const input: GradeInput = {
    capacitySats: node.capacity ?? 0,
    activeChannels: node.active_channel_count ?? 0,
    firstSeen: node.first_seen || null,
    updatedAt: node.updated_at || null,
    now,
    clearnetSockets: sockets.filter((socket) => !socket.includes(".onion")).length,
    torSockets: sockets.filter((socket) => socket.includes(".onion")).length,
    feeRatesPpm: opens.map((channel) => channel.fee_rate).filter((rate) => Number.isFinite(rate)),
    peerChannelCounts: opens
      .map((channel) => Number(channel.node?.channels))
      .filter((count) => Number.isFinite(count)),
    history: (profile.stats ?? []).map((point) => ({
      added: Number(point.added),
      capacity: Number(point.capacity),
      channels: Number(point.channels),
    })),
    capacityRank: rankOf(rankings?.liquidity, node.public_key),
    connectivityRank: rankOf(rankings?.connectivity, node.public_key),
  };
  return gradeNode(input);
}

export type NodeGradeLoad =
  | { status: "not-found"; pubkey: string }
  | { status: "unavailable"; pubkey: string }
  | {
      status: "ready";
      pubkey: string;
      profile: Extract<NodeProfile, { status: "ready" }>;
      grade: NodeGrade;
    };

/**
 * Profile plus report card for one request. generateMetadata, the node page,
 * and the card page share this. Rankings are the daily cached lists, so a
 * grade does not add a short-lived fetch to the node route.
 */
export const loadNodeGrade = cache(async (pubkeyRaw: string): Promise<NodeGradeLoad> => {
  const pubkey = pubkeyRaw.toLowerCase();
  const rankingsPromise = loadDailyRankings();
  let profile: NodeProfile;
  try {
    profile = await loadNodeProfile(pubkeyRaw);
  } catch (err) {
    unstable_rethrow(err);
    console.warn("node profile unavailable:", err instanceof Error ? err.message : err);
    return { status: "unavailable", pubkey };
  }
  if (profile.status !== "ready") return { status: "not-found", pubkey };
  const rankings = await rankingsPromise;
  return {
    status: "ready",
    pubkey: profile.node.public_key || pubkey,
    profile,
    grade: gradeFromProfile(profile, rankings),
  };
});
