import { cache } from "react";
import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getLightning, safe, type ChannelListItem, type NodeDetail } from "./api";
import { loadDailyRankings } from "./directory";
import { candidatesFromRankings, recommendPeers, type PeerRecommendation } from "./recommend";
import { isLightningPubkey, nodePageDecision, resolveNodeDetail } from "./upstream";

// Same day-long window as a node profile. Channel pages reuse the fetch
// cache the profile already fills for index 0.
const DAY = 86_400;
const CHANNEL_PAGE = 10;
const MAX_CHANNEL_PAGES = 3;

export type Recommendation =
  | { status: "not-found"; pubkey: string }
  | {
      status: "ready";
      pubkey: string;
      alias: string;
      activeChannels: number;
      capacity: number;
      channelsSampled: number;
      distinctPeers: number;
      peersComplete: boolean;
      picks: PeerRecommendation[];
    };

async function channelPage(pubkey: string, index: number): Promise<ChannelListItem[] | null> {
  return safe(
    getLightning<ChannelListItem[]>(
      `/lightning/channels?public_key=${encodeURIComponent(pubkey)}&status=open&index=${index}`,
      DAY,
    ),
  );
}

async function buildRecommendation(pubkey: string): Promise<Recommendation> {
  const [node, firstPage] = await Promise.all([
    resolveNodeDetail<NodeDetail>(pubkey, { revalidate: DAY }),
    channelPage(pubkey, 0),
  ]);
  const active = node.active_channel_count ?? 0;
  const pages = Math.min(MAX_CHANNEL_PAGES, Math.max(1, Math.ceil(active / CHANNEL_PAGE) || 1));
  const rest =
    pages > 1
      ? await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) => channelPage(pubkey, index + 1)),
        )
      : [];
  const lists = [firstPage, ...rest];
  const failed = lists.some((list) => list == null);
  const peers = new Set<string>();
  let channelsSampled = 0;
  for (const list of lists) {
    if (!list) continue;
    channelsSampled += list.length;
    for (const channel of list) {
      const peer = channel.node?.public_key?.toLowerCase();
      if (peer) peers.add(peer);
    }
  }
  const rankings = await loadDailyRankings();
  const candidates = rankings
    ? candidatesFromRankings(rankings.connectivity, rankings.liquidity)
    : [];
  return {
    status: "ready",
    pubkey,
    alias: (node.alias || "Anonymous").trim() || "Anonymous",
    activeChannels: active,
    capacity: node.capacity ?? 0,
    channelsSampled,
    distinctPeers: peers.size,
    peersComplete: !failed && active <= pages * CHANNEL_PAGE,
    picks: recommendPeers({
      selfPubkey: pubkey,
      peerPubkeys: [...peers],
      candidates,
      now: Math.floor(Date.now() / 1000),
      limit: 5,
    }),
  };
}

const cachedRecommendation = unstable_cache(
  async (pubkey: string): Promise<Recommendation> => {
    try {
      return await buildRecommendation(pubkey);
    } catch (err) {
      if (nodePageDecision(pubkey, err) === "not-found") {
        return { status: "not-found", pubkey };
      }
      throw err;
    }
  },
  ["peer-recommend-v1"],
  { revalidate: DAY },
);

export const loadRecommendation = cache(async (pubkeyRaw: string): Promise<Recommendation> => {
  const pubkey = pubkeyRaw.toLowerCase();
  if (!isLightningPubkey(pubkey)) return { status: "not-found", pubkey };
  try {
    return await cachedRecommendation(pubkey);
  } catch (err) {
    unstable_rethrow(err);
    throw err;
  }
});
