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
} from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Lightning Network nodes by country",
  description:
    "Every country running public Bitcoin Lightning Network nodes, ranked by total channel capacity. Node counts, BTC capacity and share of the network.",
  path: "/countries",
});

export default async function CountriesHub() {
  const countries = (await safe(api.countries())) ?? [];
  const ranked = countries
    .slice()
    .sort((a, b) => b.capacity - a.capacity)
    .filter((c) => c.iso);
  const totalCap = ranked.reduce((acc, c) => acc + c.capacity, 0);
  const maxCap = ranked[0]?.capacity ?? 1;
  const totalNodes = ranked.reduce((acc, c) => acc + c.count, 0);

  const jsonLd = [
    datasetJsonLd({
      name: "Lightning Network nodes by country",
      description: `Ranked list of ${ranked.length} countries running public Lightning Network nodes, covering ${formatNumber(totalNodes)} nodes.`,
      path: "/countries",
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Countries", path: "/countries" },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ COUNTRIES</div>
        <h1 className="display text-[32px] md:text-[56px] lg:text-[72px] leading-[0.95] text-paper">
          LIGHTNING NETWORK<br className="hidden md:block" /> BY COUNTRY
        </h1>
        <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 md:mt-4 max-w-2xl">
          {formatNumber(ranked.length)} countries run public Lightning nodes.
          Click any row to see its full breakdown — nodes, hosting providers,
          capacity history.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[color:var(--rule)] rule-b">
        <Kpi label="COUNTRIES" value={formatNumber(ranked.length)} />
        <Kpi label="TOTAL NODES" value={formatNumber(totalNodes)} />
        <Kpi label="TOTAL CAPACITY" value={`${compactNumber(totalCap / 1e8)} BTC`} />
        <Kpi
          label="TOP COUNTRY"
          value={ranked[0]?.name?.en ?? "—"}
          noTabular
        />
      </div>

      <div className="bg-ink">
        <Panel id="C01" title="RANKING" meta={`${ranked.length} COUNTRIES`} className="border-0">
          <div className="px-4 md:px-8 py-4 md:py-6 grid gap-3 md:grid-cols-2">
            {ranked.map((c, i) => (
              <Link
                key={`${c.iso}-${i}`}
                href={`/countries/${c.iso.toLowerCase()}`}
                className="group block py-2"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="mono-xs text-paper-faint tabular w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mono-xs text-amber tabular shrink-0">
                      {c.iso}
                    </span>
                    <span className="ui text-[13px] text-paper truncate group-hover:text-amber transition-colors">
                      {c.name.en}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    <span className="mono-xs tabular text-paper-dim">
                      {formatNumber(c.count)} nodes
                    </span>
                    <span className="mono tabular text-paper text-[13px]">
                      {compactNumber(c.capacity / 1e8)} BTC
                    </span>
                  </div>
                </div>
                <RankBar value={c.capacity} max={maxCap} />
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

function Kpi({
  label,
  value,
  noTabular,
}: {
  label: string;
  value: string;
  noTabular?: boolean;
}) {
  return (
    <div className="bg-ink px-4 py-3">
      <div className="mono-xs text-paper-faint mb-1">{label}</div>
      <div
        className={`display text-[20px] md:text-[24px] leading-none text-paper truncate ${noTabular ? "" : "tabular"}`}
      >
        {value}
      </div>
    </div>
  );
}
