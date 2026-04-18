import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  api,
  safe,
  formatSats,
  formatNumber,
  formatDate,
  compactNumber,
  shortKey,
  type ChannelListItem,
} from "@/lib/api";
import { AreaChart } from "@/components/chart";
import { Panel } from "@/components/panel";
import { ambossNode } from "@/lib/amboss";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  buildMetadata,
  datasetJsonLd,
  jsonLdScript,
  slugifyIsp,
} from "@/lib/seo";

export const revalidate = 300;
// Allow any pubkey at runtime — we pre-render the top-ranked set but fall
// back to on-demand ISR for everyone else.
export const dynamicParams = true;

// Pre-render the union of top-ranked nodes so the HTML is ready for Googlebot's
// first crawl. Remaining nodes render on-demand and are then cached by ISR.
export async function generateStaticParams() {
  const [liq, conn, old] = await Promise.all([
    safe(api.topByCapacity()),
    safe(api.topByConnectivity()),
    safe(api.oldest()),
  ]);
  const keys = new Set<string>();
  for (const list of [liq, conn, old]) {
    if (!list) continue;
    for (const n of list) if (n.publicKey) keys.add(n.publicKey);
  }
  return Array.from(keys).map((pubkey) => ({ pubkey }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}): Promise<Metadata> {
  const { pubkey } = await params;
  const node = await safe(api.node(pubkey));
  if (!node) {
    return buildMetadata({
      title: "Lightning node",
      description: "Lightning Network node profile on ln.fyi.",
      path: `/nodes/${pubkey}`,
      noindex: true,
    });
  }
  const alias = (node.alias || "Anonymous").trim();
  const country =
    node.country && typeof node.country === "object"
      ? (node.country as { en?: string }).en
      : undefined;
  const isp = node.as_organization?.trim();
  const capacityBtc = formatSats(node.capacity);
  const channels = formatNumber(node.active_channel_count);
  const firstSeen = node.first_seen ? formatDate(node.first_seen) : null;
  const title = `${alias} — Lightning Node Profile`;
  const descriptionParts = [
    `${alias} is a public Lightning Network node holding ${capacityBtc} BTC across ${channels} active channels.`,
    country ? `Hosted in ${country}${isp ? ` on ${isp}` : ""}.` : isp ? `Hosted on ${isp}.` : null,
    firstSeen ? `First seen ${firstSeen}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return buildMetadata({
    title,
    description: descriptionParts,
    path: `/nodes/${pubkey}`,
  });
}

const SECONDS_PER_BLOCK = 600;
const EXPLORER = "https://mempool.space";

export default async function NodePage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;

  const [
    node,
    stats,
    tipHeight,
    openA,
    openB,
    openC,
    closedA,
    closedB,
    closedC,
    amboss,
  ] = await Promise.all([
    safe(api.node(pubkey)),
    safe(api.nodeStats(pubkey)),
    safe(api.tipHeight()),
    safe(api.nodeChannels(pubkey, "open", 0)),
    safe(api.nodeChannels(pubkey, "open", 10)),
    safe(api.nodeChannels(pubkey, "open", 20)),
    safe(api.nodeChannels(pubkey, "closed", 0)),
    safe(api.nodeChannels(pubkey, "closed", 10)),
    safe(api.nodeChannels(pubkey, "closed", 20)),
    ambossNode(pubkey),
  ]);

  if (!node) return notFound();

  const sortedStats = (stats ?? []).slice().sort((a, b) => a.added - b.added);
  const capPoints = sortedStats.map((s) => ({ x: s.added, y: s.capacity / 1e8 }));
  const chanPoints = sortedStats.map((s) => ({ x: s.added, y: s.channels }));

  const country =
    (node.country && typeof node.country === "object"
      ? (node.country as { en?: string }).en
      : undefined) ?? "—";
  const city =
    (node.city && typeof node.city === "object"
      ? (node.city as { en?: string }).en
      : undefined) ?? "—";
  const sockets = node.sockets ? node.sockets.split(",").filter(Boolean) : [];
  const clearSockets = sockets.filter((s) => !s.includes(".onion"));
  const torSockets = sockets.filter((s) => s.includes(".onion"));
  const colorFill =
    node.color && /^#[0-9a-f]{6}$/i.test(node.color) ? node.color : "#ff8a3d";
  const isoCode = node.iso_code?.toLowerCase() ?? null;
  const ispSlug = node.as_organization ? slugifyIsp(node.as_organization) : null;
  const ambossWebsite = amboss?.socials?.info?.website?.trim() || null;
  const ambossTwitter = amboss?.socials?.info?.twitter?.trim() || null;

  const avgChan =
    node.active_channel_count > 0
      ? node.capacity / node.active_channel_count
      : 0;

  // Build the public-tx feed. Opens get an approximate time derived from the
  // channel's funding block height (current tip minus delta * 600s). Closes
  // already carry a real closing_date. Deduped by channel id in case the
  // sliding-window pagination overlaps.
  const now = Math.floor(Date.now() / 1000);
  const tip = tipHeight ?? 0;
  const opens = dedupeById(concat(openA, openB, openC));
  const closes = dedupeById(concat(closedA, closedB, closedC));

  const feed: FeedItem[] = [
    ...opens.map((c): FeedItem => {
      const block = parseInt(c.short_id.split("x")[0] ?? "0", 10) || 0;
      const approx = tip > 0 && block > 0
        ? now - (tip - block) * SECONDS_PER_BLOCK
        : 0;
      return {
        kind: "OPEN",
        time: approx,
        approx: true,
        capacity: c.capacity,
        peer: c.node,
        block,
        channelId: c.id,
      };
    }),
    ...closes.map((c): FeedItem => {
      const block = parseInt(c.short_id.split("x")[0] ?? "0", 10) || 0;
      return {
        kind: closingKind(c.closing_reason),
        time: c.closing_date ?? 0,
        approx: false,
        capacity: c.capacity,
        peer: c.node,
        block,
        channelId: c.id,
      };
    }),
  ]
    .filter((i) => i.time > 0)
    .sort((a, b) => b.time - a.time)
    .slice(0, 24);

  const nodeAlias = (node.alias || "Anonymous").trim();
  const jsonLd = [
    datasetJsonLd({
      name: `${nodeAlias} — Lightning Node`,
      description: `Public Lightning Network node ${nodeAlias} (${pubkey.slice(0, 12)}…) with ${formatSats(node.capacity)} BTC capacity across ${formatNumber(node.active_channel_count)} active channels.`,
      path: `/nodes/${pubkey}`,
      lastModified: node.updated_at,
      keywords: [
        nodeAlias,
        "Lightning node",
        "Lightning Network",
        "Bitcoin",
        country && country !== "—" ? country : null,
        node.as_organization || null,
      ].filter((x): x is string => !!x),
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Nodes", path: "/nodes" },
      { name: nodeAlias, path: `/nodes/${pubkey}` },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto md:overflow-hidden">
      {/* Header — compact, single-line on desktop so the dashboard fits in the viewport */}
      <div className="rule-b px-4 md:px-6 lg:px-8 py-3 md:py-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <div className="min-w-0 flex-1">
            <div className="mono-xs text-amber mb-1.5">§ NODE PROFILE</div>
            <div className="flex items-center gap-2.5 md:gap-3">
              <span
                className="inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
                style={{
                  background: colorFill,
                  boxShadow: `0 0 14px ${colorFill}66`,
                }}
              />
              <h1 className="display text-[24px] md:text-[32px] lg:text-[40px] leading-[0.95] text-paper truncate">
                {(node.alias || "ANONYMOUS").toUpperCase()}
              </h1>
            </div>
            <div className="mono-xs text-paper-faint tabular break-all mt-1.5 max-w-3xl hidden md:block">
              {pubkey}
            </div>
          </div>
          <div className="shrink-0 md:text-right">
            <div className="mono-xs text-paper-faint mb-0.5">TOTAL CAPACITY</div>
            <div className="display tabular text-[28px] md:text-[32px] lg:text-[40px] leading-[0.95] text-paper">
              {formatSats(node.capacity)}
              <span className="mono-xs text-amber ml-2 align-middle">₿ BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-[1px] bg-[color:var(--rule)] rule-b shrink-0">
        <StatCell label="ACTIVE CHANNELS" value={formatNumber(node.active_channel_count)} />
        <StatCell
          label="OPENED"
          value={formatNumber(node.opened_channel_count ?? 0)}
        />
        <StatCell
          label="CLOSED"
          value={formatNumber(node.closed_channel_count ?? 0)}
        />
        <StatCell
          label="AVG CHANNEL"
          value={avgChan > 0 ? compactNumber(avgChan) : "—"}
          unit="sats"
        />
        <StatCell
          label="FIRST SEEN"
          value={node.first_seen ? formatDate(node.first_seen) : "—"}
          noTabular
        />
        <StatCell
          label="LOCATION"
          value={
            [city, country].filter((s) => s && s !== "—").join(", ") || "—"
          }
          noTabular
        />
      </div>

      {/* Body grid: 2×2. Left column is charts, right column is metadata + tx feed. */}
      <div className="flex flex-col md:flex-1 md:min-h-0 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-[1px] md:bg-[color:var(--rule)]">
        {/* Top-left: capacity chart */}
        <div className="bg-ink h-[280px] md:h-auto md:col-span-8 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="N01"
            title="CAPACITY HISTORY"
            meta="₿ BTC · DAILY"
            className="h-full border-0"
          >
            <div className="p-3 h-full">
              {capPoints.length > 1 ? (
                <AreaChart data={capPoints} format="btc" compact />
              ) : (
                <Empty />
              )}
            </div>
          </Panel>
        </div>

        {/* Top-right: server metadata — merged network + infra */}
        <div className="bg-ink md:col-span-4 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="N02"
            title="SERVER METADATA"
            meta="INFRA · NETWORK"
            className="h-full border-0"
          >
            <ServerMetadata
              asOrg={node.as_organization}
              asNumber={node.as_number}
              ispSlug={ispSlug}
              latitude={node.latitude}
              longitude={node.longitude}
              updatedAt={node.updated_at}
              clearSockets={clearSockets}
              torSockets={torSockets}
              city={city}
              country={country}
              isoCode={isoCode}
              website={ambossWebsite}
              twitter={ambossTwitter}
            />
          </Panel>
        </div>

        {/* Bottom-left: channels chart */}
        <div className="bg-ink h-[240px] md:h-auto md:col-span-4 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="N03"
            title="CHANNEL COUNT"
            meta="DAILY"
            className="h-full border-0"
          >
            <div className="p-3 h-full">
              {chanPoints.length > 1 ? (
                <AreaChart
                  data={chanPoints}
                  accent="var(--paper)"
                  format="number"
                  compact
                />
              ) : (
                <Empty />
              )}
            </div>
          </Panel>
        </div>

        {/* Bottom-right: public transactions feed */}
        <div className="bg-ink md:col-span-8 md:row-span-1">
          <Panel
            id="N04"
            title="PUBLIC TRANSACTIONS"
            meta={`ONCHAIN · ${feed.length} RECENT`}
            className="h-full border-0"
          >
            {feed.length > 0 ? (
              <TxFeed items={feed} />
            ) : (
              <Empty label="NO ONCHAIN ACTIVITY" />
            )}
          </Panel>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feed types + helpers                                                */
/* ------------------------------------------------------------------ */

type FeedKind = "OPEN" | "COOP_CLOSE" | "FORCE_CLOSE" | "BREACH_CLOSE";

type FeedItem = {
  kind: FeedKind;
  time: number; // unix seconds
  approx: boolean; // true when derived from block height
  capacity: number; // sats
  peer: ChannelListItem["node"];
  block: number;
  channelId: string;
};

function closingKind(code: number | null): FeedKind {
  if (code === 1) return "COOP_CLOSE";
  if (code === 2 || code === 3) return "FORCE_CLOSE";
  if (code === 4) return "BREACH_CLOSE";
  return "COOP_CLOSE";
}

function concat<T>(...xs: (T[] | null | undefined)[]): T[] {
  return xs.flatMap((x) => x ?? []);
}

function dedupeById(xs: ChannelListItem[]): ChannelListItem[] {
  const seen = new Set<string>();
  const out: ChannelListItem[] = [];
  for (const c of xs) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Small components                                                    */
/* ------------------------------------------------------------------ */

function StatCell({
  label,
  value,
  unit,
  noTabular,
}: {
  label: string;
  value: string;
  unit?: string;
  noTabular?: boolean;
}) {
  return (
    <div className="bg-ink px-4 py-2.5">
      <div className="mono-xs text-paper-faint mb-1">{label}</div>
      <div
        className={`display text-[18px] md:text-[20px] leading-none text-paper truncate ${
          noTabular ? "" : "tabular"
        }`}
      >
        {value}
        {unit && (
          <span className="mono text-[10px] text-paper-dim ml-1.5">{unit}</span>
        )}
      </div>
    </div>
  );
}

function Empty({ label = "NO DATA" }: { label?: string }) {
  return (
    <div className="h-full flex items-center justify-center mono-xs text-paper-faint">
      {label}
    </div>
  );
}

function ServerMetadata({
  asOrg,
  asNumber,
  ispSlug,
  latitude,
  longitude,
  updatedAt,
  clearSockets,
  torSockets,
  city,
  country,
  isoCode,
  website,
  twitter,
}: {
  asOrg?: string;
  asNumber?: number;
  ispSlug?: string | null;
  latitude?: number;
  longitude?: number;
  updatedAt?: number;
  clearSockets: string[];
  torSockets: string[];
  city: string;
  country: string;
  isoCode?: string | null;
  website?: string | null;
  twitter?: string | null;
}) {
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const geoLine =
    [city, country].filter((s) => s && s !== "—").join(" · ") || null;
  const allSockets = [
    ...clearSockets.map((s) => ({ socket: s, kind: "CLEAR" as const })),
    ...torSockets.map((s) => ({ socket: s, kind: "TOR" as const })),
  ];
  return (
    <div className="p-4 md:p-5 md:h-full md:overflow-auto flex flex-col">
      <MetaSection label="AUTONOMOUS SYSTEM">
        {asOrg ? (
          ispSlug ? (
            <Link
              href={`/isp/${ispSlug}`}
              className="ui-bold text-[15px] text-paper leading-tight hover:text-amber transition-colors"
            >
              {asOrg}
            </Link>
          ) : (
            <div className="ui-bold text-[15px] text-paper leading-tight">
              {asOrg}
            </div>
          )
        ) : (
          <div className="ui-bold text-[15px] text-paper leading-tight">—</div>
        )}
        {asNumber ? (
          <div className="mono-xs text-paper-faint tabular mt-1">
            AS{asNumber}
          </div>
        ) : null}
      </MetaSection>

      {(geoLine || hasCoords) && (
        <MetaSection label="GEOLOCATION">
          {isoCode && country && country !== "—" ? (
            <Link
              href={`/countries/${isoCode}`}
              className="ui text-[13px] text-paper hover:text-amber transition-colors"
            >
              {geoLine || "—"}
            </Link>
          ) : (
            <div className="ui text-[13px] text-paper">{geoLine || "—"}</div>
          )}
          {hasCoords && (
            <div className="mono-xs text-paper-faint tabular mt-1">
              {latitude!.toFixed(4)}°, {longitude!.toFixed(4)}°
            </div>
          )}
        </MetaSection>
      )}

      {(website || twitter) && (
        <MetaSection label="OPERATOR">
          {website && (
            <div className="mono-xs text-paper truncate">
              <a
                href={website}
                target="_blank"
                rel="noreferrer nofollow"
                className="hover:text-amber transition-colors"
              >
                {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </div>
          )}
          {twitter && (
            <div className="mono-xs text-paper-faint tabular mt-1">
              <a
                href={`https://twitter.com/${twitter.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer nofollow"
                className="hover:text-amber transition-colors"
              >
                @{twitter.replace(/^@/, "")}
              </a>
            </div>
          )}
        </MetaSection>
      )}

      <MetaSection
        label="NETWORK ADDRESSES"
        trailing={
          <span className="mono-xs text-paper-faint tabular">
            {allSockets.length}
          </span>
        }
      >
        {allSockets.length === 0 ? (
          <div className="mono-xs text-paper-faint">—</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {allSockets.map(({ socket, kind }) => (
              <SocketRow key={socket} socket={socket} kind={kind} />
            ))}
          </div>
        )}
      </MetaSection>

      <MetaSection label="LAST UPDATE">
        <div className="mono tabular text-paper text-[12px]">
          {updatedAt ? formatDate(updatedAt) : "—"}
        </div>
      </MetaSection>
    </div>
  );
}

function MetaSection({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-t border-[color:var(--rule)] first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="mono-xs text-paper-faint">{label}</div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function SocketRow({ socket, kind }: { socket: string; kind: "CLEAR" | "TOR" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="mono text-paper text-[11px] truncate min-w-0">
        {socket}
      </div>
      <div
        className={`mono-xs shrink-0 tracking-wide ${
          kind === "TOR" ? "text-amber" : "text-paper-faint"
        }`}
      >
        {kind}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public transactions feed                                            */
/* ------------------------------------------------------------------ */

function TxFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 md:gap-x-5 px-4 md:px-5 py-2 sticky top-0 bg-ink rule-b z-10">
        <div className="mono-xs text-paper-faint">WHEN</div>
        <div className="mono-xs text-paper-faint hidden md:block">TYPE</div>
        <div className="mono-xs text-paper-faint">PEER</div>
        <div className="mono-xs text-paper-faint tabular text-right">CAPACITY</div>
        <div className="mono-xs text-paper-faint tabular text-right hidden md:block">
          BLOCK
        </div>
      </div>
      <div>
        {items.map((it) => (
          <TxRow key={`${it.kind}-${it.channelId}`} item={it} />
        ))}
      </div>
    </div>
  );
}

function TxRow({ item }: { item: FeedItem }) {
  const meta = kindMeta(item.kind);
  const when = formatRelative(item.time);
  return (
    <div className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_auto_1fr_auto_auto] items-center gap-x-4 md:gap-x-5 px-4 md:px-5 py-[9px] rule-b hover:bg-[#ffffff05] transition-colors">
      {/* WHEN */}
      <div className="min-w-0">
        <div className="mono text-[11px] text-paper tabular">
          {item.approx && (
            <span className="text-paper-faint/60 mr-0.5">~</span>
          )}
          {when}
        </div>
        <div className="mono-xs text-paper-faint tabular">
          {formatClock(item.time)}
        </div>
      </div>

      {/* TYPE BADGE (desktop only column; mobile shows it merged above peer) */}
      <div className="hidden md:flex items-center">
        <span
          className="inline-flex items-center gap-1.5 mono-xs tracking-wide px-2 py-[3px] rounded-[2px]"
          style={{
            color: meta.fg,
            background: meta.bg,
            borderLeft: `2px solid ${meta.fg}`,
          }}
        >
          <span aria-hidden>{meta.glyph}</span>
          {meta.label}
        </span>
      </div>

      {/* PEER */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="md:hidden mono-xs" style={{ color: meta.fg }}>
            {meta.glyph}
          </span>
          <Link
            href={`/nodes/${item.peer.public_key}`}
            className="ui text-[13px] text-paper truncate hover:text-amber transition-colors"
          >
            {item.peer.alias || "—"}
          </Link>
        </div>
        <div className="mono-xs text-paper-faint tabular truncate">
          {shortKey(item.peer.public_key)}
        </div>
      </div>

      {/* CAPACITY */}
      <div className="text-right shrink-0">
        <div className="mono tabular text-paper text-[12px]">
          ₿ {formatSats(item.capacity)}
        </div>
        <div className="mono-xs text-paper-faint tabular">
          {compactNumber(item.capacity)} sats
        </div>
      </div>

      {/* BLOCK — external link to mempool explorer */}
      <a
        href={`${EXPLORER}/lightning/channel/${item.channelId}`}
        target="_blank"
        rel="noreferrer"
        className="hidden md:block text-right shrink-0 hover:text-amber transition-colors"
      >
        <div className="mono-xs tabular text-paper-dim group-hover:text-paper">
          #{formatNumber(item.block)}
        </div>
        <div className="mono-xs text-paper-faint/60 tabular">↗</div>
      </a>
    </div>
  );
}

function kindMeta(kind: FeedKind): {
  label: string;
  glyph: string;
  fg: string;
  bg: string;
} {
  switch (kind) {
    case "OPEN":
      return {
        label: "OPEN",
        glyph: "↗",
        fg: "var(--good, #6ad27a)",
        bg: "rgba(106,210,122,0.08)",
      };
    case "COOP_CLOSE":
      return {
        label: "COOP CLOSE",
        glyph: "↘",
        fg: "var(--paper-dim, #b9b2a2)",
        bg: "rgba(255,255,255,0.04)",
      };
    case "FORCE_CLOSE":
      return {
        label: "FORCE CLOSE",
        glyph: "⚠",
        fg: "var(--amber, #ff8a3d)",
        bg: "rgba(255,138,61,0.08)",
      };
    case "BREACH_CLOSE":
      return {
        label: "BREACH",
        glyph: "✕",
        fg: "var(--bad, #ff6464)",
        bg: "rgba(255,100,100,0.1)",
      };
  }
}

function formatRelative(unix: number): string {
  if (!unix) return "—";
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatClock(unix: number): string {
  if (!unix) return "";
  const d = new Date(unix * 1000);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}
