import Link from "next/link";
import { formatNumber, formatSats } from "@/lib/api";
import { RecommendForm } from "@/components/recommend-form";
import { loadDailyRankings } from "@/lib/directory";
import { capRouteRevalidate } from "@/lib/node-profile";
import { candidatesFromRankings, recommendPeers } from "@/lib/recommend";
import { SITE_NAME, breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const revalidate = 86400;

export const metadata = buildMetadata({
  title: "Who should I open a channel with?",
  description:
    "Paste a Lightning pubkey and get a short list of well-connected peers your node is not already connected to, each with a one-line reason. Computed from cached rankings.",
  path: "/recommend",
});

const BLANK = "00".repeat(33);

export default async function RecommendPage() {
  const rankings = await loadDailyRankings();
  if (!rankings) await capRouteRevalidate(600);
  const now = Math.floor(Date.now() / 1000);
  const featured = rankings
    ? recommendPeers({
        selfPubkey: BLANK,
        peerPubkeys: [],
        candidates: candidatesFromRankings(rankings.connectivity, rankings.liquidity),
        now,
        limit: 5,
      })
    : [];
  const jsonLd = breadcrumbJsonLd([
    { name: SITE_NAME, path: "/" },
    { name: "Who to peer with", path: "/recommend" },
  ]);

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ 04 · PEERS</div>
        <h1 className="display text-[34px] md:text-[60px] leading-[0.92] text-paper max-w-4xl">
          WHO SHOULD I OPEN
          <br />A CHANNEL WITH?
        </h1>
        <p className="ui text-[14px] md:text-[16px] text-paper-dim mt-4 max-w-2xl leading-relaxed">
          A short list of reliable, well-connected nodes your pubkey is not already
          peered with. The candidate pool is the connectivity ranking, refreshed
          daily. Your channels are read once and cached, not crawled channel by channel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 rule-b lg:rule-r px-4 md:px-8 lg:px-12 py-6 md:py-8">
          <RecommendForm />
          <ol className="mt-8 space-y-4">
            <Step n="01" title="Paste a pubkey" body="From your node, or use the link on any ln.fyi profile. The result page is not indexed." />
            <Step n="02" title="We drop existing peers" body="Up to the first 30 open channels are excluded. Larger hubs are told when that sample is incomplete." />
            <Step n="03" title="Five reasons" body="Connectivity rank, age, and a fresh directory timestamp. One line each, linking back to the profile." />
          </ol>
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/nodes" className="mono-xs text-paper-dim hover:text-amber transition-colors">
              NODE DIRECTORY
            </Link>
            <Link href="/movers" className="mono-xs text-paper-dim hover:text-amber transition-colors">
              WEEKLY MOVERS
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 px-4 md:px-8 py-6 md:py-8">
          <div className="mono-xs text-paper-faint mb-4">STRONG PEERS RIGHT NOW</div>
          {featured.length === 0 ? (
            <p className="ui text-[14px] text-paper-dim">
              The ranking list did not answer. The form will still try when you submit.
            </p>
          ) : (
            <ul>
              {featured.map((peer, index) => (
                <li key={peer.pubkey} className="rule-b py-3">
                  <Link href={`/nodes/${peer.pubkey}`} className="group block">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mono-xs text-paper-faint tabular">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="ui text-[16px] text-paper truncate group-hover:text-amber transition-colors">
                          {peer.alias}
                        </div>
                      </div>
                      <div className="mono tabular text-[12px] text-paper shrink-0">
                        {formatSats(peer.capacitySats)}
                        <span className="text-paper-faint ml-1">BTC</span>
                      </div>
                    </div>
                    <p className="ui text-[13px] text-paper-dim mt-1 leading-snug">{peer.reason}</p>
                    <div className="mono-xs text-paper-faint mt-1 tabular">
                      {formatNumber(peer.channels)} CH · CONNECTIVITY #{peer.connectivityRank}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mono-xs text-paper-faint mt-4 leading-relaxed">
            These five ignore your existing channels. Submit a pubkey to remove the ones you already have.
          </p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="mono-xs text-amber pt-1">{n}</div>
      <div>
        <div className="ui-bold text-[15px] text-paper">{title}</div>
        <p className="ui text-[13px] text-paper-dim mt-1 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
