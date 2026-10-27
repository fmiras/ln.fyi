import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect, unstable_rethrow } from "next/navigation";
import { formatNumber, formatSats } from "@/lib/api";
import { RecommendForm } from "@/components/recommend-form";
import { capRouteRevalidate } from "@/lib/node-profile";
import { loadRecommendation } from "@/lib/peer-recommendations";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const maxDuration = 15;
export const dynamicParams = true;

// No pubkeys at build time. The first request is cached for a day so a
// crawler that ignores nofollow does not recompute the list on every hit.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}): Promise<Metadata> {
  const { pubkey } = await params;
  const key = pubkey.toLowerCase();
  const fallback = buildMetadata({
    title: "Channel ideas",
    description: "Peer suggestions for one Lightning node. This result is not indexed.",
    path: `/recommend/${key}`,
    noindex: true,
    nofollow: true,
  });
  try {
    const result = await loadRecommendation(key);
    if (result.status !== "ready") return fallback;
    return buildMetadata({
      title: `Peers for ${result.alias}`,
      description: `Well-connected Lightning peers ${result.alias} is not already connected to, each with a one-line reason.`,
      path: `/recommend/${result.pubkey}`,
      noindex: true,
      nofollow: true,
    });
  } catch (err) {
    unstable_rethrow(err);
    return fallback;
  }
}

export default async function RecommendResultPage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  const key = pubkey.toLowerCase();
  if (pubkey !== key) permanentRedirect(`/recommend/${key}`);
  let result;
  try {
    result = await loadRecommendation(key);
  } catch (err) {
    unstable_rethrow(err);
    await capRouteRevalidate(60);
    return <RecommendUnavailable pubkey={key} />;
  }
  if (result.status === "not-found") notFound();

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ 04 · PEERS</div>
        <h1 className="display text-[32px] md:text-[56px] leading-[0.92] text-paper">
          PEERS FOR {result.alias.toUpperCase()}
        </h1>
        <p className="ui text-[14px] md:text-[15px] text-paper-dim mt-3 max-w-2xl leading-relaxed">
          {formatSats(result.capacity)} BTC · {formatNumber(result.activeChannels)} active channels.
          {" "}
          {result.peersComplete
            ? `Removed ${formatNumber(result.distinctPeers)} existing public peers.`
            : `Saw ${formatNumber(result.distinctPeers)} peers in the first ${formatNumber(result.channelsSampled)} open channels. This node has ${formatNumber(result.activeChannels)} active channels, so confirm before opening — the sample stops at 30 channels.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          <Link href={`/nodes/${result.pubkey}`} className="mono-xs text-paper-dim hover:text-amber transition-colors">
            PROFILE
          </Link>
          <Link href={`/nodes/${result.pubkey}/card`} className="mono-xs text-paper-dim hover:text-amber transition-colors">
            REPORT CARD
          </Link>
          <Link href="/movers" className="mono-xs text-paper-dim hover:text-amber transition-colors">
            WEEKLY MOVERS
          </Link>
          <Link href="/recommend" className="mono-xs text-paper-dim hover:text-amber transition-colors">
            TRY ANOTHER
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 py-2">
        {result.picks.length === 0 ? (
          <p className="ui text-[15px] text-paper-dim py-8 max-w-xl">
            No fresh candidate was left after removing this node and the peers we could see.
            The pool is the top of the connectivity ranking, and nodes silent for more than a week are skipped.
          </p>
        ) : (
          <ol>
            {result.picks.map((peer, index) => (
              <li key={peer.pubkey} className="rule-b">
                <Link
                  href={`/nodes/${peer.pubkey}`}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-4 md:py-5"
                >
                  <div className="md:col-span-1 mono-xs text-paper-faint tabular pt-1">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="md:col-span-4 min-w-0">
                    <div className="ui text-[18px] md:text-[20px] text-paper truncate group-hover:text-amber transition-colors">
                      {peer.alias}
                    </div>
                    <div className="mono-xs text-paper-faint mt-1 tabular">
                      CONNECTIVITY #{peer.connectivityRank}
                      {peer.capacityRank ? ` · CAPACITY #${peer.capacityRank}` : ""}
                    </div>
                  </div>
                  <p className="md:col-span-5 ui text-[14px] text-paper-dim leading-relaxed">
                    {peer.reason}
                  </p>
                  <div className="md:col-span-2 md:text-right">
                    <div className="mono tabular text-[13px] text-paper">
                      {formatSats(peer.capacitySats)} <span className="text-paper-faint">BTC</span>
                    </div>
                    <div className="mono-xs text-paper-faint tabular mt-1">
                      {formatNumber(peer.channels)} CH
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rule-t px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <RecommendForm initial={result.pubkey} />
      </div>
    </div>
  );
}

function RecommendUnavailable({ pubkey }: { pubkey: string }) {
  return (
    <div className="flex-1 overflow-auto px-4 md:px-8 py-10 max-w-3xl">
      <div className="mono-xs text-amber mb-3">§ 04 · PEERS</div>
      <h1 className="display text-[32px] md:text-[48px] text-paper">TEMPORARILY UNAVAILABLE</h1>
      <p className="ui text-[15px] text-paper-dim mt-4">
        The directory did not answer in time. This suggestion was not computed and will be tried again shortly.
      </p>
      <div className="mono-xs text-paper-faint break-all mt-6">{pubkey}</div>
      <div className="mt-8 max-w-xl">
        <RecommendForm initial={pubkey} />
      </div>
    </div>
  );
}
