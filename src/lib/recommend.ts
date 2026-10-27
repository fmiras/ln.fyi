// Pure peer recommender. The candidate pool is precomputed from rankings;
// this only filters and ranks that pool.

export type PeerCandidate = {
  pubkey: string;
  alias: string;
  channels: number;
  capacitySats: number;
  firstSeen: number | null;
  updatedAt: number | null;
  connectivityRank: number;
  capacityRank: number | null;
};

export type PeerRecommendation = PeerCandidate & {
  score: number;
  reason: string;
};

export type RecommendInput = {
  selfPubkey: string;
  peerPubkeys: string[];
  candidates: PeerCandidate[];
  now: number;
  limit?: number;
};

const DAY = 86_400;
const STALE_AFTER = 7 * DAY;
const MIN_CHANNELS = 10;

type RankingNode = {
  publicKey: string;
  alias?: string;
  channels?: number;
  capacity?: number;
  firstSeen?: number;
  updatedAt?: number;
};

/**
 * Top connectivity rankings, enriched with a liquidity rank when the same
 * pubkey appears on the capacity list. Order of `connectivity` is the rank.
 */
export function candidatesFromRankings(
  connectivity: RankingNode[],
  liquidity: RankingNode[],
  limit = 40,
): PeerCandidate[] {
  const capacityRank = new Map<string, number>();
  liquidity.forEach((node, index) => {
    if (!node.publicKey) return;
    capacityRank.set(node.publicKey.toLowerCase(), index + 1);
  });
  const liquidityByKey = new Map<string, RankingNode>();
  for (const node of liquidity) {
    if (node.publicKey) liquidityByKey.set(node.publicKey.toLowerCase(), node);
  }
  const out: PeerCandidate[] = [];
  const seen = new Set<string>();
  connectivity.forEach((node, index) => {
    if (out.length >= limit) return;
    const key = node.publicKey?.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const twin = liquidityByKey.get(key);
    out.push({
      pubkey: key,
      alias: (node.alias || twin?.alias || "Anonymous").trim() || "Anonymous",
      channels: finite(node.channels ?? twin?.channels) ?? 0,
      capacitySats: finite(node.capacity ?? twin?.capacity) ?? 0,
      firstSeen: finite(node.firstSeen ?? twin?.firstSeen),
      updatedAt: finite(node.updatedAt ?? twin?.updatedAt),
      connectivityRank: index + 1,
      capacityRank: capacityRank.get(key) ?? null,
    });
  });
  return out;
}

export function recommendPeers(input: RecommendInput): PeerRecommendation[] {
  const limit = input.limit ?? 5;
  const self = input.selfPubkey.toLowerCase();
  const peers = new Set(input.peerPubkeys.map((key) => key.toLowerCase()));
  const seen = new Set<string>();
  const ranked: PeerRecommendation[] = [];

  for (const candidate of input.candidates) {
    const pubkey = candidate.pubkey.toLowerCase();
    if (!pubkey || pubkey === self || peers.has(pubkey) || seen.has(pubkey)) continue;
    if (candidate.channels < MIN_CHANNELS) continue;
    const fresh = freshness(candidate.updatedAt, input.now);
    if (fresh == null) continue;
    seen.add(pubkey);
    const age = ageScore(candidate.firstSeen, input.now);
    const score = clamp(
      Math.round(scoreRank(candidate.connectivityRank) * 0.62 + fresh * 0.2 + age * 0.18),
    );
    ranked.push({
      ...candidate,
      pubkey,
      score,
      reason: recommendationReason(candidate, input.now),
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.connectivityRank - b.connectivityRank || a.pubkey.localeCompare(b.pubkey));
  return ranked.slice(0, Math.max(0, limit));
}

export function recommendationReason(candidate: PeerCandidate, now: number): string {
  const channels = formatInt(candidate.channels);
  const btc = btcLabel(candidate.capacitySats);
  const year = candidate.firstSeen ? new Date(candidate.firstSeen * 1000).getUTCFullYear() : null;
  const old = candidate.firstSeen != null && now - candidate.firstSeen >= 3 * 365.25 * DAY;
  if (candidate.connectivityRank <= 10 && old && year) {
    return `Connectivity #${candidate.connectivityRank} since ${year}, with ${channels} public channels.`;
  }
  if (candidate.connectivityRank <= 15) {
    return `Connectivity #${candidate.connectivityRank} · ${channels} channels and ${btc} BTC.`;
  }
  if (candidate.capacityRank != null && candidate.capacityRank <= 25) {
    return `Capacity #${candidate.capacityRank} and connectivity #${candidate.connectivityRank}, ${btc} BTC you are not peered with.`;
  }
  if (year) {
    return `Public since ${year}, connectivity #${candidate.connectivityRank} with ${channels} channels.`;
  }
  return `Connectivity #${candidate.connectivityRank} with ${channels} channels and ${btc} BTC.`;
}

/** Pull a compressed pubkey out of a pasted node URI, host, or bare hex. */
export function parsePubkeyInput(raw: string): string | null {
  const match = raw.trim().match(/[0-9a-fA-F]{66}/);
  return match ? match[0].toLowerCase() : null;
}

function freshness(updatedAt: number | null, now: number): number | null {
  if (updatedAt == null) return 70;
  if (!Number.isFinite(updatedAt)) return null;
  const age = now - updatedAt;
  if (age > STALE_AFTER) return null;
  if (age <= DAY) return 100;
  if (age <= 3 * DAY) return 84;
  return 62;
}

function ageScore(firstSeen: number | null, now: number): number {
  if (!firstSeen || firstSeen > now) return 55;
  const days = (now - firstSeen) / DAY;
  if (days >= 365 * 5.5) return 100;
  if (days >= 365 * 4) return 94;
  if (days >= 365 * 2) return 86;
  if (days >= 365) return 76;
  if (days >= 180) return 64;
  if (days >= 30) return 48;
  return 30;
}

function scoreRank(rank: number): number {
  if (rank <= 1) return 100;
  if (rank <= 3) return 97;
  if (rank <= 10) return 93;
  if (rank <= 25) return 84;
  if (rank <= 50) return 74;
  if (rank <= 100) return 64;
  return 55;
}

function finite(value: number | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function btcLabel(sats: number): string {
  const btc = sats / 1e8;
  if (Math.abs(btc) >= 100) return btc.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Math.abs(btc) >= 1) {
    return btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return btc.toLocaleString("en-US", { maximumFractionDigits: 4 });
}
