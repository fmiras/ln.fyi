/**
 * Minimal Amboss GraphQL client. Amboss is a public Lightning Network
 * explorer (amboss.space) that exposes richer per-node metadata than
 * mempool's rankings — descriptions, socials, channel health.
 *
 * The public endpoint requires no auth for this query. Calls are
 * cached server-side via Next's fetch cache with a long revalidate.
 */

const ENDPOINT = "https://api.amboss.space/graphql";

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
