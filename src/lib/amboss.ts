/**
 * Minimal Amboss GraphQL client. Amboss is a public Lightning Network
 * explorer (amboss.space) that exposes richer per-node metadata than
 * mempool's rankings — descriptions, socials, channel health.
 *
 * The public endpoint requires no auth for this query. Calls are
 * cached server-side via Next's fetch cache with a long revalidate.
 */

const ENDPOINT = "https://api.amboss.space/graphql";
const AMBOSS_TIMEOUT_MS = 2_000;

export type AmbossNode = {
  alias: string | null;
  metrics?: {
    capacity: string | number | null;
    channels: number | null;
  } | null;
  socials?: {
    info?: {
      email?: string | null;
      private?: boolean | null;
      telegram?: string | null;
      twitter?: string | null;
      twitter_verified?: boolean | null;
      website?: string | null;
    } | null;
  } | null;
};

const QUERY = `
query ($pubkey: String!) {
  getNode(pubkey: $pubkey) {
    alias
    socials {
      info {
        email
        private
        telegram
        twitter
        twitter_verified
        website
      }
    }
  }
}`;

export type AmbossRankRow = {
  pubkey: string;
  rank: number;
  /** Weekly rank change. Positive means the node moved up the list. */
  week: number;
};

const RANK_QUERY = `
query {
  getRankLists {
    capacity { pubkey rank rank_change { week } }
    channels { pubkey rank rank_change { week } }
  }
}`;

/**
 * One public Amboss call: weekly rank movement for its published top lists.
 * Mempool does not serve historical rank. Cached for a day; failures are empty.
 */
export async function ambossRankLists(): Promise<{
  capacity: AmbossRankRow[];
  channels: AmbossRankRow[];
} | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: RANK_QUERY }),
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(AMBOSS_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: {
        getRankLists?: {
          capacity?: { pubkey?: string; rank?: number; rank_change?: { week?: number } }[];
          channels?: { pubkey?: string; rank?: number; rank_change?: { week?: number } }[];
        };
      };
      errors?: unknown;
    };
    if (body.errors || !body.data?.getRankLists) return null;
    const map = (
      rows: { pubkey?: string; rank?: number; rank_change?: { week?: number } }[] | undefined,
    ): AmbossRankRow[] =>
      (rows ?? [])
        .filter((row) => !!row.pubkey && Number.isFinite(row.rank))
        .map((row) => ({
          pubkey: row.pubkey as string,
          rank: row.rank as number,
          week: Number.isFinite(row.rank_change?.week) ? (row.rank_change?.week as number) : 0,
        }));
    return {
      capacity: map(body.data.getRankLists.capacity),
      channels: map(body.data.getRankLists.channels),
    };
  } catch {
    return null;
  }
}

export async function ambossNode(pubkey: string): Promise<AmbossNode | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { pubkey } }),
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(AMBOSS_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: { getNode?: AmbossNode | null };
      errors?: unknown;
    };
    if (body.errors) return null;
    return body.data?.getNode ?? null;
  } catch {
    return null;
  }
}
