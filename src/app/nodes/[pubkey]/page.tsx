import Link from "next/link";
import { notFound } from "next/navigation";
import {
  api,
  safe,
  formatSats,
  formatNumber,
  shortKey,
  formatDate,
  compactNumber,
} from "@/lib/api";
import { AreaChart } from "@/components/chart";
import { Panel } from "@/components/panel";

export const revalidate = 600;

export default async function NodePage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;

  const [node, stats] = await Promise.all([
    safe(api.node(pubkey)),
    safe(api.nodeStats(pubkey)),
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
  const colorFill =
    node.color && /^#[0-9a-f]{6}$/i.test(node.color) ? node.color : "#ff8a3d";

  const avgChan =
    node.active_channel_count > 0
      ? node.capacity / node.active_channel_count
      : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb + header */}
      <div className="rule-b px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/nodes" className="mono-xs text-paper-faint hover:text-amber">
            ← NODES
          </Link>
          <span className="mono-xs text-paper-faint">/</span>
          <span className="mono-xs text-paper-faint tabular truncate">
            {shortKey(pubkey)}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
          <div className="min-w-0">
            <div className="mono-xs text-amber mb-2">§ NODE PROFILE</div>
            <div className="flex items-center gap-3 md:gap-4">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{
                  background: colorFill,
                  boxShadow: `0 0 14px ${colorFill}66`,
                }}
              />
              <h1 className="display text-[28px] md:text-[56px] leading-none text-paper truncate">
                {(node.alias || "ANONYMOUS").toUpperCase()}
              </h1>
            </div>
            <div className="mono-xs text-paper-faint tabular break-all mt-2">
              {pubkey}
            </div>
          </div>
          <div className="shrink-0 md:text-right">
            <div className="mono-xs text-paper-faint mb-1">TOTAL CAPACITY</div>
            <div className="display tabular text-[40px] md:text-[52px] leading-none text-paper">
              {formatSats(node.capacity)}
            </div>
            <div className="mono-xs text-amber mt-1">₿ BTC</div>
          </div>
        </div>
      </div>

      {/* KPI row — 2 cols mobile, 6 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-[1px] bg-[color:var(--rule)] rule-b">
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

      {/* Charts — stack on mobile, grid at md+ */}
      <div className="flex flex-col md:flex-1 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-[1px] md:bg-[color:var(--rule)] md:min-h-[560px]">
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
        <div className="bg-ink md:col-span-4 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="N02"
            title="NETWORK ADDRESSES"
            meta={`${sockets.length} SOCKETS`}
            className="h-full border-0"
          >
            <div className="p-3 md:h-full md:overflow-auto">
              {sockets.length > 0 ? (
                <div className="space-y-1">
                  {sockets.map((s) => (
                    <div
                      key={s}
                      className="flex items-baseline justify-between gap-3 py-1.5 rule-b"
                    >
                      <div className="mono text-paper text-[11px] truncate">
                        {s}
                      </div>
                      <div className="mono-xs text-paper-faint shrink-0">
                        {s.includes(".onion") ? "TOR" : "CLEAR"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty />
              )}
            </div>
          </Panel>
        </div>
        <div className="bg-ink h-[240px] md:h-auto md:col-span-8 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="N03"
            title="CHANNEL COUNT"
            meta="COUNT · DAILY"
            className="h-full border-0"
          >
            <div className="p-3 h-full">
              {chanPoints.length > 1 ? (
                <AreaChart data={chanPoints} accent="var(--paper)" format="number" compact />
              ) : (
                <Empty />
              )}
            </div>
          </Panel>
        </div>
        <div className="bg-ink md:col-span-4 md:row-span-1">
          <Panel
            id="N04"
            title="INFRASTRUCTURE"
            meta="AS / HOSTING"
            className="h-full border-0"
          >
            <div className="p-4 md:h-full flex flex-col gap-5">
              <div>
                <div className="mono-xs text-paper-faint mb-1">
                  AUTONOMOUS SYSTEM
                </div>
                <div className="ui text-[16px] text-paper">
                  {node.as_organization || "—"}
                </div>
                {node.as_number && (
                  <div className="mono-xs text-paper-faint tabular mt-0.5">
                    AS{node.as_number}
                  </div>
                )}
              </div>
              <div>
                <div className="mono-xs text-paper-faint mb-1">LAST UPDATE</div>
                <div className="mono tabular text-paper text-[13px]">
                  {node.updated_at ? formatDate(node.updated_at) : "—"}
                </div>
              </div>
              {typeof node.longitude === "number" &&
                typeof node.latitude === "number" && (
                  <div>
                    <div className="mono-xs text-paper-faint mb-1">
                      COORDINATES
                    </div>
                    <div className="mono tabular text-paper text-[13px]">
                      {node.latitude.toFixed(4)}°, {node.longitude.toFixed(4)}°
                    </div>
                  </div>
                )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-ink px-4 py-3">
      <div className="mono-xs text-paper-faint mb-2">{label}</div>
      <div
        className={`display text-[20px] md:text-[24px] leading-none text-paper truncate ${
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

function Empty() {
  return (
    <div className="h-full flex items-center justify-center mono-xs text-paper-faint">
      NO DATA
    </div>
  );
}
