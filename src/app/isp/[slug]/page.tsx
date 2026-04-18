import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  api,
  safe,
  formatNumber,
  formatSats,
  compactNumber,
  shortKey,
} from "@/lib/api";
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
import { topLiquidityWithDetails } from "@/lib/rankings";

export const revalidate = 3600;
export const dynamicParams = true;

const MIN_NODES_TO_INDEX = 3;

export async function generateStaticParams() {
  const ranked = (await safe(api.ispsRanked())) ?? [];
  return ranked
    .filter((i) => i.name && i.nodes >= MIN_NODES_TO_INDEX)
    .map((i) => ({ slug: slugifyIsp(i.name) }));
}

async function loadIsp(slug: string) {
  const ranked = (await safe(api.ispsRanked())) ?? [];
  const sorted = ranked
    .slice()
    .sort((a, b) => b.capacity - a.capacity);
  const idx = sorted.findIndex((i) => slugifyIsp(i.name) === slug);
  if (idx < 0) return null;
  const totalCap = sorted.reduce((acc, i) => acc + i.capacity, 0);
  return {
    match: sorted[idx],
    rank: idx + 1,
    totalProviders: sorted.length,
    totalCap,
    neighbors: {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadIsp(slug);
  if (!data) {
    return buildMetadata({
      title: "Hosting provider not found",
      description: "This hosting provider has no indexed Lightning nodes.",
      path: `/isp/${slug}`,
      noindex: true,
    });
  }
  const { match, rank } = data;
  const title = `${match.name} Lightning Network — ${formatNumber(match.nodes)} nodes, ${compactNumber(match.capacity / 1e8)} BTC`;
  const description = `${match.name} hosts ${formatNumber(match.nodes)} public Lightning Network nodes across ${formatNumber(match.channels)} channels, totalling ${compactNumber(match.capacity / 1e8)} BTC of capacity — ranked #${rank} among all Lightning hosting providers.`;
  return buildMetadata({
    title,
    description,
    path: `/isp/${slug}`,
    noindex: match.nodes < MIN_NODES_TO_INDEX,
  });
}

export default async function IspPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, enriched] = await Promise.all([
    loadIsp(slug),
    topLiquidityWithDetails(),
  ]);
  if (!data) return notFound();

  const { match, rank, totalCap, totalProviders, neighbors } = data;
  const share = totalCap > 0 ? (match.capacity / totalCap) * 100 : 0;

  // Top nodes on this ISP, matched by AS number
  const asSet = new Set(match.asNumbers);
  const nodesOnIsp = enriched
    .filter(
      (n) => n.detail?.as_number != null && asSet.has(n.detail.as_number),
    )
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 20);

  // Country distribution within this ISP's matched nodes
  const countryMap = new Map<
    string,
    { iso: string; name: string; count: number; capacity: number }
  >();
  for (const n of nodesOnIsp) {
    const iso = n.detail?.iso_code?.toLowerCase();
    const name =
      n.detail?.country && typeof n.detail.country === "object"
        ? (n.detail.country as { en?: string }).en
        : undefined;
    if (!iso || !name) continue;
    const prev = countryMap.get(iso);
    if (prev) {
      prev.count += 1;
      prev.capacity += n.capacity;
    } else {
      countryMap.set(iso, { iso, name, count: 1, capacity: n.capacity });
    }
  }
  const topCountries = Array.from(countryMap.values())
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 5);
  const maxCountryCap = topCountries[0]?.capacity ?? 1;

  const jsonLd = [
    datasetJsonLd({
      name: `Lightning Network nodes on ${match.name}`,
      description: `${match.nodes} Lightning nodes and ${match.channels} channels hosted on ${match.name}, totalling ${compactNumber(match.capacity / 1e8)} BTC.`,
      path: `/isp/${slug}`,
      keywords: [
        `${match.name} Lightning`,
        `${match.name} Bitcoin`,
        "Lightning hosting",
        "Lightning Network",
      ],
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Hosting providers", path: "/isp" },
      { name: match.name, path: `/isp/${slug}` },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="mono-xs text-amber mb-2">
              § HOSTING · RANK #{rank}
            </div>
            <h1 className="display text-[28px] md:text-[48px] lg:text-[60px] leading-[0.95] text-paper">
              LIGHTNING NODES<br className="hidden md:block" /> ON {match.name.toUpperCase()}
            </h1>
            <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 md:mt-4 max-w-2xl">
              {match.name} hosts {formatNumber(match.nodes)} public Lightning Network nodes running {formatNumber(match.channels)} channels and holding {compactNumber(match.capacity / 1e8)} BTC of capacity — {share.toFixed(2)}% of the total network, rank #{rank} of {totalProviders} providers.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/isp"
              className="mono-xs text-paper-faint hover:text-amber transition-colors"
            >
              ← ALL PROVIDERS
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[color:var(--rule)] rule-b">
        <Stat label="NODES" value={formatNumber(match.nodes)} />
        <Stat label="CHANNELS" value={formatNumber(match.channels)} />
        <Stat label="CAPACITY" value={`${compactNumber(match.capacity / 1e8)} BTC`} />
        <Stat
          label="AS NUMBERS"
          value={match.asNumbers.length > 0 ? match.asNumbers.join(", ") : "—"}
        />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-[1px] bg-[color:var(--rule)] auto-rows-min">
        {/* Top nodes on ISP */}
        <div className="col-span-12 md:col-span-8 bg-ink">
          <Panel
            id="I01"
            title={`TOP NODES ON ${match.name.toUpperCase()}`}
            meta={`${nodesOnIsp.length} OF TOP 100`}
            className="h-full border-0"
          >
            {nodesOnIsp.length === 0 ? (
              <div className="p-6 ui text-[13px] text-paper-dim">
                None of the top-100 liquidity leaders currently run on {match.name}. This may change — the top rankings refresh hourly. Browse the{" "}
                <Link
                  href="/nodes"
                  className="text-amber hover:underline"
                >
                  full directory
                </Link>{" "}
                or other{" "}
                <Link
                  href="/isp"
                  className="text-amber hover:underline"
                >
                  hosting providers
                </Link>.
              </div>
            ) : (
              <div className="px-4 md:px-6 py-3 md:py-4">
                {nodesOnIsp.map((n, i) => {
                  const ctry =
                    n.detail?.country && typeof n.detail.country === "object"
                      ? (n.detail.country as { en?: string }).en
                      : undefined;
                  return (
                    <Link
                      key={n.publicKey}
                      href={`/nodes/${n.publicKey}`}
                      className="group flex items-center gap-3 py-2.5 rule-b last:border-b-0 hover:bg-[#ffffff05] transition-colors"
                    >
                      <span className="mono-xs text-paper-faint tabular w-6 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="ui text-[14px] text-paper truncate group-hover:text-amber transition-colors">
                          {n.alias || "Anonymous"}
                        </div>
                        <div className="mono-xs text-paper-faint tabular truncate">
                          {shortKey(n.publicKey)}
                          {ctry ? ` · ${ctry}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="mono tabular text-paper text-[13px]">
                          ₿ {formatSats(n.capacity)}
                        </div>
                        <div className="mono-xs text-paper-faint tabular">
                          {formatNumber(n.channels)} ch
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Countries + neighbors */}
        <div className="col-span-12 md:col-span-4 bg-ink flex flex-col">
          <div>
            <Panel
              id="I02"
              title="COUNTRIES"
              meta={`${topCountries.length} JURISDICTIONS`}
              className="border-0"
            >
              {topCountries.length === 0 ? (
                <div className="p-5 mono-xs text-paper-faint">—</div>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  {topCountries.map((c, i) => (
                    <Link
                      key={c.iso}
                      href={`/countries/${c.iso}`}
                      className="group block"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="mono-xs text-paper-faint tabular w-4 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="mono-xs text-amber tabular shrink-0">
                            {c.iso.toUpperCase()}
                          </span>
                          <span className="ui text-[12px] text-paper truncate group-hover:text-amber transition-colors">
                            {c.name}
                          </span>
                        </div>
                        <span className="mono-xs tabular text-paper-dim shrink-0">
                          {compactNumber(c.capacity / 1e8)}
                        </span>
                      </div>
                      <RankBar value={c.capacity} max={maxCountryCap} />
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {(neighbors.prev || neighbors.next) && (
            <div className="rule-t">
              <Panel
                id="I03"
                title="NEIGHBORS BY RANK"
                className="border-0"
              >
                <div className="p-5 space-y-3">
                  {neighbors.prev && (
                    <Link
                      href={`/isp/${slugifyIsp(neighbors.prev.name)}`}
                      className="flex items-baseline justify-between gap-2 hover:text-amber transition-colors"
                    >
                      <span className="mono-xs text-paper-faint">↑ ABOVE</span>
                      <span className="ui text-[13px] text-paper truncate">
                        {neighbors.prev.name}
                      </span>
                    </Link>
                  )}
                  {neighbors.next && (
                    <Link
                      href={`/isp/${slugifyIsp(neighbors.next.name)}`}
                      className="flex items-baseline justify-between gap-2 hover:text-amber transition-colors"
                    >
                      <span className="mono-xs text-paper-faint">↓ BELOW</span>
                      <span className="ui text-[13px] text-paper truncate">
                        {neighbors.next.name}
                      </span>
                    </Link>
                  )}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink px-4 py-3">
      <div className="mono-xs text-paper-faint mb-1">{label}</div>
      <div className="display text-[20px] md:text-[24px] leading-none text-paper tabular truncate">
        {value}
      </div>
    </div>
  );
}
