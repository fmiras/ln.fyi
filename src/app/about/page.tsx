import Link from "next/link";
import { Panel } from "@/components/panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "ln.fyi is an open, real-time editorial dashboard for the Bitcoin Lightning Network. Data from mempool.space. No accounts, no tracking, public domain.",
  path: "/about",
});

const GITHUB_URL = "https://github.com/fmiras/ln.fyi";

export default function About() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      {/* Page header */}
      <div className="rule-b px-4 md:px-8 lg:px-12 py-4 md:py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="mono-xs text-amber mb-2">§ 04 · ABOUT</div>
          <h1 className="display text-[28px] md:text-[64px] lg:text-[88px] leading-[0.9] text-paper">
            ln.fyi / OPEN<br className="hidden md:block" /> LIGHTNING ATLAS
          </h1>
          <p className="ui text-[12px] md:text-[15px] text-paper-dim mt-3 md:mt-5 max-w-xl">
            A real-time, editorial dashboard for the Bitcoin Lightning Network.
            Free, open, no accounts, no tracking.
          </p>
        </div>
        <div className="mono-xs text-paper-faint tabular md:pb-2 md:text-right md:text-[12px]">
          <div>VERSION 0.1</div>
          <div>LICENSE · PUBLIC DOMAIN</div>
        </div>
      </div>

      {/* Body grid */}
      <div className="flex-1 grid grid-cols-12 gap-[1px] bg-[color:var(--rule)] auto-rows-min">
        {/* Mission */}
        <div className="col-span-12 md:col-span-8 bg-ink">
          <Panel id="B01" title="WHAT THIS IS" className="h-full border-0">
            <div className="p-6 md:p-10 lg:p-12 space-y-5 md:space-y-6">
              <p className="ui text-[15px] md:text-[19px] lg:text-[21px] leading-[1.5] text-paper">
                <span className="ui-bold text-amber">ln.fyi</span>{" "}
                is an open dashboard for the Bitcoin Lightning Network — a
                real-time
                control-room view of every public node, channel and satoshi
                flowing through the network&apos;s second layer.
              </p>
              <div className="md:columns-2 md:gap-10 lg:gap-14 space-y-4 md:space-y-0">
                <p className="ui text-[14px] md:text-[14px] leading-[1.65] text-paper-dim md:mb-4 md:break-inside-avoid">
                  The Lightning Network is a payment protocol built on top of
                  Bitcoin that enables instant, near-zero-fee transactions by
                  opening state channels between participating nodes. Thousands
                  of nodes run it quietly around the world. Most of the data is
                  public, but it is not especially legible.
                </p>
                <p className="ui text-[14px] md:text-[14px] leading-[1.65] text-paper-dim md:mb-4 md:break-inside-avoid">
                  This site aims to fix that. It reads public data from
                  mempool.space&apos;s Lightning API and renders it as a single,
                  data-dense dashboard you can use to understand the state and
                  trajectory of the network without clicking through pages, or
                  installing anything, or signing up for anything.
                </p>
                <p className="ui text-[14px] md:text-[14px] leading-[1.65] text-paper-dim md:break-inside-avoid">
                  It is intentionally minimal: one screen, real numbers, no ads,
                  no tracking, no upsell. Every chart and table here is
                  rebuildable from the same public endpoints — the code is open.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* Quick facts */}
        <div className="col-span-12 md:col-span-4 bg-ink">
          <Panel id="B02" title="AT A GLANCE" className="h-full border-0">
            <div className="divide-y divide-[color:var(--rule)] md:px-2 lg:px-4">
              <FactRow label="SOURCE" value="mempool.emzy.de" />
              <FactRow label="SOFTWARE" value="mempool.space" />
              <FactRow label="ENDPOINTS" value="Lightning REST v1" />
              <FactRow label="AUTH" value="None" />
              <FactRow label="REFRESH" value="≈5 min (cached)" />
              <FactRow label="COST" value="Free · forever" />
              <FactRow label="TRACKING" value="None" />
              <FactRow label="LICENSE" value="Public domain" />
            </div>
          </Panel>
        </div>

        {/* Data sources */}
        <div className="col-span-12 md:col-span-6 bg-ink">
          <Panel id="B03" title="DATA SOURCES" className="h-full border-0">
            <div className="p-5 md:p-8 lg:p-10 space-y-4 md:space-y-5">
              <SourceItem
                name="mempool.emzy.de · Lightning API"
                url="https://mempool.emzy.de/"
                description="Primary live feed for all metrics on this site. A community-run mempool.space instance whose Lightning crawler is kept current — network-wide statistics, node rankings, geographic distribution, ISP breakdown and individual node histories."
              />
              <SourceItem
                name="mempool.space"
                url="https://mempool.space/docs/api/rest"
                description="The open-source explorer that defines the API schema we consume. The flagship mempool.space instance hosts the reference docs; we query an up-to-date mirror running the same software."
              />
              <SourceItem
                name="Bitcoin Lightning Network"
                url="https://lightning.network/"
                description="The underlying protocol. Layer-2 payment network built on Bitcoin, enabling instant, low-fee transactions through payment channels."
              />
            </div>
          </Panel>
        </div>

        {/* What you'll find */}
        <div className="col-span-12 md:col-span-6 bg-ink">
          <Panel id="B04" title="SECTIONS" className="h-full border-0">
            <div className="p-5 md:p-8 lg:p-10 space-y-3 md:space-y-4">
              <NavItem
                href="/"
                num="01"
                label="OVERVIEW"
                description="The dashboard — capacity, channel count, node count, fee rates, top liquidity leaders, routing hubs, country breakdown. Everything at a glance."
              />
              <NavItem
                href="/nodes"
                num="02"
                label="NODES"
                description="Every public Lightning node, ranked by liquidity, connectivity or age. Searchable; click any row for the node&rsquo;s full profile."
              />
              <NavItem
                href="/countries"
                num="03"
                label="COUNTRIES"
                description="Lightning capacity, nodes and top hubs for every country running the network. Click a country for its breakdown."
              />
              <NavItem
                href="/isp"
                num="04"
                label="HOSTING"
                description="Where the network physically runs — every hosting provider, ranked by capacity, with the nodes they carry."
              />
            </div>
          </Panel>
        </div>

        {/* Source + credits */}
        <div className="col-span-12 md:col-span-8 bg-ink">
          <Panel
            id="B05"
            title="SOURCE"
            meta="OPEN SOURCE"
            className="h-full border-0"
          >
            <div className="p-6 md:p-10 lg:p-12">
              <div className="mono-xs text-paper-faint mb-3 md:mb-4">
                VIEW, FORK OR AUDIT
              </div>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 md:gap-4 ui-bold text-[22px] md:text-[34px] lg:text-[42px] text-paper hover:text-amber transition-colors"
              >
                <span className="mono text-amber">↗</span>
                <span className="underline decoration-[color:var(--rule-strong)] decoration-1 underline-offset-4 md:underline-offset-[6px] group-hover:decoration-amber">
                  {GITHUB_URL.replace("https://", "")}
                </span>
              </a>
              <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-4 md:mt-6 max-w-2xl leading-[1.65]">
                The code behind this site is open and publicly readable. Every
                API call, every transformation, every chart is in the
                repository. You can fork it, audit it, self-host it, or open
                an issue. Built with Next.js, TypeScript, and Tailwind.
              </p>
            </div>
          </Panel>
        </div>

        {/* Contact / colophon */}
        <div className="col-span-12 md:col-span-4 bg-ink">
          <Panel id="B06" title="COLOPHON" className="h-full border-0">
            <div className="p-5 md:p-8 lg:p-10 space-y-4 md:space-y-5">
              <div>
                <div className="mono-xs text-paper-faint mb-1">
                  TYPOGRAPHY
                </div>
                <div className="ui text-[13px] text-paper">
                  IBM Plex Sans · IBM Plex Sans Condensed · IBM Plex Mono
                </div>
              </div>
              <div>
                <div className="mono-xs text-paper-faint mb-1">STACK</div>
                <div className="ui text-[13px] text-paper">
                  Next.js · TypeScript · Tailwind
                </div>
              </div>
              <div>
                <div className="mono-xs text-paper-faint mb-1">CHARTS</div>
                <div className="ui text-[13px] text-paper">
                  Hand-rolled SVG · no libraries
                </div>
              </div>
              <div className="pt-3 rule-t">
                <div className="mono-xs text-paper-faint mb-1">BUILT FOR</div>
                <div className="ui text-[13px] text-paper">
                  Anyone curious about the shape of Bitcoin&rsquo;s second layer.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="mono-xs text-paper-faint">{label}</span>
      <span className="mono text-[12px] text-paper tabular">{value}</span>
    </div>
  );
}

function SourceItem({
  name,
  url,
  description,
}: {
  name: string;
  url: string;
  description: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group block rule-b pb-4 last:border-b-0 last:pb-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="ui-bold text-[14px] text-paper group-hover:text-amber transition-colors">
          {name}
        </div>
        <span className="mono-xs text-paper-faint group-hover:text-amber">
          ↗
        </span>
      </div>
      <p className="ui text-[12px] text-paper-dim mt-1.5 leading-[1.55]">
        {description}
      </p>
    </a>
  );
}

function NavItem({
  href,
  num,
  label,
  description,
}: {
  href: string;
  num: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rule-b pb-3 last:border-b-0 last:pb-0 hover:bg-[#ffffff05] transition-colors px-1"
    >
      <div className="flex items-baseline gap-3">
        <span className="mono-xs text-paper-faint">{num}</span>
        <span className="mono-bold text-[13px] text-paper group-hover:text-amber transition-colors">
          {label}
        </span>
        <span className="mono-xs text-paper-faint ml-auto">→</span>
      </div>
      <p className="ui text-[12px] text-paper-dim mt-1 ml-7 leading-[1.55]">
        {description}
      </p>
    </Link>
  );
}
