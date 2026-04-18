import Link from "next/link";
import {
  api,
  safe,
  formatSats,
  formatNumber,
  compactNumber,
  shortKey,
  pctChange,
} from "@/lib/api";
import { AreaChart, RankBar } from "@/components/chart";
import { KPI, Panel } from "@/components/panel";

export const revalidate = 300;

export default async function Home() {
  const [latest, history, topLiq, topConn, countries] = await Promise.all([
    safe(api.latest()),
    safe(api.history("2y")),
    safe(api.topByCapacity()),
    safe(api.topByConnectivity()),
    safe(api.countries()),
  ]);

  const nodes = latest?.node_count ?? 0;
  const channels = latest?.channel_count ?? 0;
  const avgCapacity = latest?.avg_capacity ?? 0;
  const medCapacity = latest?.med_capacity ?? 0;
  const avgFee = latest?.avg_fee_rate ?? 0;
  const torNodes = latest?.tor_nodes ?? 0;
  const clearnet = latest?.clearnet_nodes ?? 0;

  const sortedHistory = (history ?? []).slice().sort((a, b) => a.added - b.added);
  const capacityPoints = sortedHistory.map((h) => ({
    x: h.added,
    y: h.total_capacity / 1e8,
  }));
  const channelPoints = sortedHistory.map((h) => ({
    x: h.added,
    y: h.channel_count,
  }));
  const nodePoints = sortedHistory.map((h) => ({
    x: h.added,
    y: h.clearnet_nodes + h.tor_nodes,
  }));

  const delta30 = (() => {
    if (sortedHistory.length < 2) return { cap: null, nodes: null, chans: null };
    const latestH = sortedHistory[sortedHistory.length - 1];
    const priorIdx = sortedHistory.findIndex(
      (h) => h.added >= latestH.added - 30 * 86400,
    );
    const prior = sortedHistory[Math.max(0, priorIdx)];
    return {
      cap: pctChange(latestH.total_capacity, prior.total_capacity),
      nodes: pctChange(
        latestH.clearnet_nodes + latestH.tor_nodes,
        prior.clearnet_nodes + prior.tor_nodes,
      ),
      chans: pctChange(latestH.channel_count, prior.channel_count),
    };
  })();

  const topLiqList = (topLiq ?? []).slice(0, 10);
  const topConnList = (topConn ?? []).slice(0, 10);
  const topCountries = (countries ?? [])
    .slice()
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 10);
  const maxCountryCap = topCountries[0]?.capacity ?? 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto md:overflow-hidden">
      {/* KPI STRIP — responsive 2/3/6 cols, 1px grid gaps render as hairlines */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-[color:var(--rule)] rule-b">
        <KpiCell
          label="TOTAL CAPACITY"
          value={formatSats(latest?.total_capacity ?? 0)}
          unit="BTC"
          delta={delta30.cap}
          tooltip="Total BTC locked across all public Lightning channels. Delta compares current value to 30 days ago."
        />
        <KpiCell
          label="PUBLIC CHANNELS"
          value={formatNumber(channels)}
          delta={delta30.chans}
          tooltip="Count of currently open, publicly announced payment channels. Delta compares current value to 30 days ago."
        />
        <KpiCell
          label="ACTIVE NODES"
          value={formatNumber(nodes)}
          delta={delta30.nodes}
          sub={`${formatNumber(clearnet)} clear · ${formatNumber(torNodes)} tor`}
          tooltip="Public Lightning nodes that have announced themselves to the network. Delta compares current total to 30 days ago."
        />
        <KpiCell
          label="AVG CHANNEL"
          value={compactNumber(avgCapacity)}
          unit="sats"
          sub={`median ${compactNumber(medCapacity)}`}
          tooltip="Mean channel capacity across all public channels. 'Median' shows the 50th-percentile channel size — often a better indicator than the average."
        />
        <KpiCell
          label="AVG FEE RATE"
          value={avgFee ? avgFee.toFixed(0) : "—"}
          unit="ppm"
          sub={`median ${(latest?.med_fee_rate ?? 0).toFixed(0)}`}
          tooltip="Average proportional routing fee charged by nodes, in parts-per-million of the routed amount. Lower is cheaper to route through."
        />
        <KpiCell
          label="TOR NODES"
          value={formatNumber(torNodes)}
          sub={
            nodes > 0
              ? `${((torNodes / nodes) * 100).toFixed(1)}% of total`
              : ""
          }
          tooltip="Nodes reachable exclusively via the Tor anonymity network. A rough indicator of privacy-layer participation."
        />
      </div>

      {/* MAIN DASHBOARD — stacks on mobile, grid at md+ */}
      <div className="flex flex-col md:flex-1 md:min-h-0 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-[1px] md:bg-[color:var(--rule)]">
        {/* Capacity chart */}
        <div className="bg-ink h-[300px] md:h-auto md:col-span-8 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="A01"
            title="NETWORK CAPACITY / 2Y"
            meta="₿ BTC · WEEKLY"
            className="h-full border-0"
          >
            <div className="p-3 h-full">
              <AreaChart data={capacityPoints} format="btc" compact />
            </div>
          </Panel>
        </div>

        {/* Liquidity leaders */}
        <div className="bg-ink md:col-span-4 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="A02"
            title="LIQUIDITY LEADERS"
            meta="TOP 10 · CAPACITY"
            href="/nodes?rank=liquidity"
            className="h-full border-0"
          >
            <NodeTable
              rows={topLiqList.map((n, i) => ({
                rank: i + 1,
                alias: n.alias,
                publicKey: n.publicKey,
                primary: formatSats(n.capacity),
                primaryUnit: "BTC",
                secondary: `${formatNumber(n.channels)} ch`,
              }))}
            />
          </Panel>
        </div>

        {/* Channels chart */}
        <div className="bg-ink h-[260px] md:h-auto md:col-span-5 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="A03"
            title="PUBLIC CHANNELS / 2Y"
            meta="COUNT · WEEKLY"
            className="h-full border-0"
          >
            <div className="p-3 h-full">
              <AreaChart
                data={channelPoints}
                format="number"
                accent="var(--paper)"
                compact
              />
            </div>
          </Panel>
        </div>

        {/* Countries */}
        <div className="bg-ink md:col-span-3 md:row-span-1 rule-b md:border-b-0">
          <Panel
            id="A04"
            title="BY COUNTRY"
            meta={`TOP 10 · ${countries?.length ?? 0} TOTAL`}
            href="/countries"
            className="h-full border-0"
          >
            <div className="p-3 md:h-full md:overflow-hidden">
              <div className="space-y-2.5">
                {topCountries.map((c, i) => (
                  <Link
                    key={`${c.iso}-${i}`}
                    href={`/countries/${c.iso.toLowerCase()}`}
                    className="group block"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="mono-xs text-paper-faint tabular w-4">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="mono-xs text-amber">{c.iso}</span>
                        <span className="ui text-[11px] text-paper truncate group-hover:text-amber transition-colors">
                          {c.name.en}
                        </span>
                      </div>
                      <span className="mono-xs tabular text-paper-dim">
                        {compactNumber(c.capacity / 1e8)}
                      </span>
                    </div>
                    <RankBar value={c.capacity} max={maxCountryCap} />
                  </Link>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Routing hubs */}
        <div className="bg-ink md:col-span-4 md:row-span-1">
          <Panel
            id="A05"
            title="ROUTING HUBS"
            meta="TOP 10 · CHANNELS"
            href="/nodes?rank=connectivity"
            className="h-full border-0"
          >
            <NodeTable
              rows={topConnList.map((n, i) => ({
                rank: i + 1,
                alias: n.alias,
                publicKey: n.publicKey,
                primary: formatNumber(n.channels),
                primaryUnit: "CH",
                secondary: `${formatSats(n.capacity)} BTC`,
              }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function KpiCell({
  label,
  value,
  unit,
  delta,
  sub,
  tooltip,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  sub?: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-ink h-[88px] md:h-[92px]">
      <KPI
        label={label}
        value={value}
        unit={unit}
        delta={delta}
        sub={sub}
        tooltip={tooltip}
      />
    </div>
  );
}

function NodeTable({
  rows,
}: {
  rows: {
    rank: number;
    alias: string;
    publicKey: string;
    primary: string;
    primaryUnit: string;
    secondary: string;
  }[];
}) {
  return (
    <div className="h-full overflow-hidden">
      {rows.map((r) => (
        <Link
          key={r.publicKey}
          href={`/nodes/${r.publicKey}`}
          className="group grid grid-cols-12 items-center gap-2 px-3 py-[7px] rule-b hover:bg-[#ffffff05] transition-colors"
        >
          <div className="col-span-1 mono-xs tabular text-paper-faint">
            {String(r.rank).padStart(2, "0")}
          </div>
          <div className="col-span-6 min-w-0">
            <div className="ui text-[12px] text-paper truncate group-hover:text-amber transition-colors">
              {r.alias || "—"}
            </div>
            <div className="mono-xs text-paper-faint truncate tabular">
              {shortKey(r.publicKey)}
            </div>
          </div>
          <div className="col-span-5 text-right">
            <div className="mono tabular text-paper text-[12px]">
              {r.primary}
              <span className="text-paper-faint ml-1 text-[10px]">{r.primaryUnit}</span>
            </div>
            <div className="mono-xs text-paper-faint tabular">{r.secondary}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

