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
  const countries = (await safe(api.countries())) ?? [];
  return countries
    .filter((c) => c.iso && c.count >= MIN_NODES_TO_INDEX)
    .map((c) => ({ iso: c.iso.toLowerCase() }));
}

async function loadCountry(iso: string) {
  const countries = (await safe(api.countries())) ?? [];
  const match = countries.find((c) => c.iso?.toLowerCase() === iso);
  if (!match) return null;
  const totalCap = countries.reduce((acc, c) => acc + c.capacity, 0);
  const totalNodes = countries.reduce((acc, c) => acc + c.count, 0);
  const rankedByCap = countries
    .slice()
    .sort((a, b) => b.capacity - a.capacity)
    .filter((c) => c.iso);
  const rank = rankedByCap.findIndex(
    (c) => c.iso?.toLowerCase() === iso,
  );
  return {
    match,
    rank: rank >= 0 ? rank + 1 : null,
    totalCap,
    totalNodes,
    networkSize: rankedByCap.length,
    neighbors: rank >= 0
      ? {
          prev: rank > 0 ? rankedByCap[rank - 1] : null,
          next: rank < rankedByCap.length - 1 ? rankedByCap[rank + 1] : null,
        }
      : { prev: null, next: null },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ iso: string }>;
}): Promise<Metadata> {
  const { iso } = await params;
  const data = await loadCountry(iso.toLowerCase());
  if (!data) {
    return buildMetadata({
      title: "Country not found",
      description: "No Lightning nodes found for this country.",
      path: `/countries/${iso}`,
      noindex: true,
    });
  }
  const { match, rank } = data;
  const name = match.name.en;
  const title = `${name} Lightning Network — ${formatNumber(match.count)} nodes, ${compactNumber(match.capacity / 1e8)} BTC capacity`;
  const description = `${match.count} public Lightning Network nodes in ${name} holding ${compactNumber(match.capacity / 1e8)} BTC of total channel capacity.${rank ? ` ${name} is ranked #${rank} by Lightning capacity.` : ""} Top hubs, hosting providers and routing data.`;
  return buildMetadata({
    title,
    description,
    path: `/countries/${iso.toLowerCase()}`,
    noindex: match.count < MIN_NODES_TO_INDEX,
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ iso: string }>;
}) {
  const { iso: isoRaw } = await params;
  const iso = isoRaw.toLowerCase();
  const [data, enriched] = await Promise.all([
    loadCountry(iso),
    topLiquidityWithDetails(),
  ]);
  if (!data) return notFound();

  const { match, rank, totalCap, totalNodes, neighbors } = data;
  const name = match.name.en;
  const share = totalCap > 0 ? (match.capacity / totalCap) * 100 : 0;
  const shareNodes = totalNodes > 0 ? (match.count / totalNodes) * 100 : 0;

  // Filter enriched top-liquidity nodes down to this country
  const nodesInCountry = enriched
    .filter((n) => n.detail?.iso_code?.toLowerCase() === iso)
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 20);

  // Aggregate those by hosting provider
  const ispMap = new Map<
    string,
    { slug: string; name: string; nodes: number; capacity: number }
  >();
  for (const n of nodesInCountry) {
    const asOrg = n.detail?.as_organization;
    if (!asOrg) continue;
    const slug = slugifyIsp(asOrg);
    const prev = ispMap.get(slug);
    if (prev) {
      prev.nodes += 1;
      prev.capacity += n.capacity;
    } else {
      ispMap.set(slug, { slug, name: asOrg, nodes: 1, capacity: n.capacity });
    }
  }
  const topIsps = Array.from(ispMap.values())
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 5);
  const maxIspCap = topIsps[0]?.capacity ?? 1;

  const jsonLd = [
    datasetJsonLd({
      name: `Lightning Network nodes in ${name}`,
      description: `${match.count} public Lightning nodes in ${name} totalling ${compactNumber(match.capacity / 1e8)} BTC of channel capacity.`,
      path: `/countries/${iso}`,
      keywords: [
        `${name} Lightning nodes`,
        `${name} Bitcoin`,
        "Lightning Network",
        match.iso,
      ],
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Countries", path: "/countries" },
      { name, path: `/countries/${iso}` },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="mono-xs text-amber mb-2">
              § COUNTRY · {match.iso}
            </div>
            <h1 className="display text-[32px] md:text-[56px] lg:text-[72px] leading-[0.95] text-paper">
              LIGHTNING NODES<br className="hidden md:block" /> IN {name.toUpperCase()}
            </h1>
            <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 md:mt-4 max-w-2xl">
              {formatNumber(match.count)} public Lightning Network nodes run in {name}{rank ? `, ranking #${rank} globally by channel capacity` : ""}. Together they hold {compactNumber(match.capacity / 1e8)} BTC — {share.toFixed(2)}% of the network.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/countries"
              className="mono-xs text-paper-faint hover:text-amber transition-colors"
            >
              ← ALL COUNTRIES
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[color:var(--rule)] rule-b">
        <Stat label="NODES" value={formatNumber(match.count)} sub={`${shareNodes.toFixed(1)}% of network`} />
        <Stat
          label="CAPACITY"
          value={`${compactNumber(match.capacity / 1e8)} BTC`}
          sub={`${share.toFixed(2)}% of network`}
        />
        <Stat
          label="GLOBAL RANK"
          value={rank ? `#${rank}` : "—"}
          sub="by capacity"
        />
        <Stat
          label="AVG PER NODE"
          value={
            match.count > 0
              ? `${compactNumber(match.capacity / match.count / 1e8)} BTC`
              : "—"
          }
          sub="channel capacity"
        />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-[1px] bg-[color:var(--rule)] auto-rows-min">
        {/* Top nodes in country */}
        <div className="col-span-12 md:col-span-8 bg-ink">
          <Panel
            id="C01"
            title={`TOP NODES IN ${name.toUpperCase()}`}
            meta={`${nodesInCountry.length} OF TOP 100`}
            className="h-full border-0"
          >
            {nodesInCountry.length === 0 ? (
              <div className="p-6 ui text-[13px] text-paper-dim">
                None of the top-100 liquidity leaders are located in {name}. Browse the{" "}
                <Link
                  href="/nodes"
                  className="text-amber hover:underline"
                >
                  full node directory
                </Link>{" "}
                or see <Link
                  href="/countries"
                  className="text-amber hover:underline"
                >
                  other countries
                </Link>.
              </div>
            ) : (
              <div className="px-4 md:px-6 py-3 md:py-4">
                {nodesInCountry.map((n, i) => (
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
                        {n.detail?.as_organization
                          ? ` · ${n.detail.as_organization}`
                          : ""}
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
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ISP breakdown + neighbor countries */}
        <div className="col-span-12 md:col-span-4 bg-ink flex flex-col">
          <div>
            <Panel
              id="C02"
              title="HOSTING PROVIDERS"
              meta={`${topIsps.length} IN COUNTRY`}
              className="border-0"
            >
              {topIsps.length === 0 ? (
                <div className="p-5 mono-xs text-paper-faint">—</div>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  {topIsps.map((isp, i) => (
                    <Link
                      key={isp.slug}
                      href={`/isp/${isp.slug}`}
                      className="group block"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="mono-xs text-paper-faint tabular w-4 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="ui text-[12px] text-paper truncate group-hover:text-amber transition-colors">
                            {isp.name}
                          </span>
                        </div>
                        <span className="mono-xs tabular text-paper-dim shrink-0">
                          {compactNumber(isp.capacity / 1e8)}
                        </span>
                      </div>
                      <RankBar value={isp.capacity} max={maxIspCap} />
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {(neighbors.prev || neighbors.next) && (
            <div className="rule-t">
              <Panel
                id="C03"
                title="NEIGHBORS BY RANK"
                className="border-0"
              >
                <div className="p-5 space-y-3">
                  {neighbors.prev && (
                    <Link
                      href={`/countries/${neighbors.prev.iso.toLowerCase()}`}
                      className="flex items-baseline justify-between gap-2 hover:text-amber transition-colors"
                    >
                      <span className="mono-xs text-paper-faint">↑ ABOVE</span>
                      <span className="ui text-[13px] text-paper truncate">
                        {neighbors.prev.name.en}
                      </span>
                    </Link>
                  )}
                  {neighbors.next && (
                    <Link
                      href={`/countries/${neighbors.next.iso.toLowerCase()}`}
                      className="flex items-baseline justify-between gap-2 hover:text-amber transition-colors"
                    >
                      <span className="mono-xs text-paper-faint">↓ BELOW</span>
                      <span className="ui text-[13px] text-paper truncate">
                        {neighbors.next.name.en}
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

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-ink px-4 py-3">
      <div className="mono-xs text-paper-faint mb-1">{label}</div>
      <div className="display text-[20px] md:text-[24px] leading-none text-paper tabular truncate">
        {value}
      </div>
      {sub && (
        <div className="mono-xs text-paper-faint tabular mt-1 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}
