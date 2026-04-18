import Link from "next/link";
import type { Metadata } from "next";
import { api, safe, formatNumber, compactNumber } from "@/lib/api";
import { Panel } from "@/components/panel";
import { RankBar } from "@/components/chart";
import {
  breadcrumbJsonLd,
  buildMetadata,
  datasetJsonLd,
  jsonLdScript,
  SITE_NAME,
  slugifyIsp,
} from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Lightning Network nodes by hosting provider",
  description:
    "Every hosting provider running public Bitcoin Lightning Network nodes, ranked by channel capacity. Clearnet, Tor and sovereign infrastructure side by side.",
  path: "/isp",
});

export default async function IspHub() {
  const [ranked, tiers] = await Promise.all([
    safe(api.ispsRanked()),
    safe(api.isps()),
  ]);
  const list = (ranked ?? [])
    .filter((i) => i.name && i.capacity > 0)
    .sort((a, b) => b.capacity - a.capacity);
  const totalCap = list.reduce((acc, i) => acc + i.capacity, 0);
  const maxCap = list[0]?.capacity ?? 1;

  const clearnet = tiers?.clearnetCapacity ?? 0;
  const tor = tiers?.torCapacity ?? 0;
  const unknown = tiers?.unknownCapacity ?? 0;

  const jsonLd = [
    datasetJsonLd({
      name: "Lightning Network nodes by hosting provider",
      description: `${list.length} hosting providers host the public Lightning Network.`,
      path: "/isp",
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Hosting providers", path: "/isp" },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ HOSTING</div>
        <h1 className="display text-[32px] md:text-[56px] lg:text-[72px] leading-[0.95] text-paper">
          WHERE THE NETWORK<br className="hidden md:block" /> IS HOSTED
        </h1>
        <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 md:mt-4 max-w-2xl">
          {formatNumber(list.length)} hosting providers run the public Lightning Network. Most capacity sits on a handful of clearnet hyperscalers — the rest is split across Tor, sovereign hardware and long-tail hosts.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[color:var(--rule)] rule-b">
        <Kpi label="PROVIDERS" value={formatNumber(list.length)} />
        <Kpi label="CLEARNET" value={`${compactNumber(clearnet / 1e8)} BTC`} />
        <Kpi label="TOR" value={`${compactNumber(tor / 1e8)} BTC`} />
        <Kpi label="UNKNOWN" value={`${compactNumber(unknown / 1e8)} BTC`} />
      </div>

      <div className="bg-ink">
        <Panel id="I01" title="RANKING" meta={`${list.length} PROVIDERS`} className="border-0">
          <div className="px-4 md:px-8 py-4 md:py-6 grid gap-3 md:grid-cols-2">
            {list.map((i, idx) => (
              <Link
                key={`${i.ispId}-${idx}`}
                href={`/isp/${slugifyIsp(i.name)}`}
                className="group block py-2"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="mono-xs text-paper-faint tabular w-6 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="ui text-[13px] text-paper truncate group-hover:text-amber transition-colors">
                      {i.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    <span className="mono-xs tabular text-paper-dim">
                      {formatNumber(i.nodes)} nodes
                    </span>
                    <span className="mono tabular text-paper text-[13px]">
                      {compactNumber(i.capacity / 1e8)} BTC
                    </span>
                  </div>
                </div>
                <RankBar value={i.capacity} max={maxCap} />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink px-4 py-3">
      <div className="mono-xs text-paper-faint mb-1">{label}</div>
      <div className="display text-[20px] md:text-[24px] leading-none text-paper truncate tabular">
        {value}
      </div>
    </div>
  );
}
