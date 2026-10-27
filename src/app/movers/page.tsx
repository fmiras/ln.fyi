import Link from "next/link";
import { formatNumber, formatSats } from "@/lib/api";
import { loadMovers, type MoverRow, type MoverSplit } from "@/lib/movers-data";
import { capRouteRevalidate } from "@/lib/node-profile";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  buildMetadata,
  datasetJsonLd,
  jsonLdScript,
} from "@/lib/seo";

export const revalidate = 86400;
export const maxDuration = 15;

export const metadata = buildMetadata({
  title: "Weekly Lightning movers",
  description:
    "Lightning nodes that gained or lost the most public capacity, channels, or rank over the last week. Refreshed daily from mempool statistics and Amboss rank changes.",
  path: "/movers",
});

export default async function MoversPage() {
  const report = await loadMovers();
  if (report.degraded) await capRouteRevalidate(60);
  else if (report.partialStats) await capRouteRevalidate(600);

  const jsonLd = [
    datasetJsonLd({
      name: "Weekly Lightning Network movers",
      description:
        "Week-over-week changes in public capacity and channel count for leading Lightning nodes, plus weekly rank movement.",
      path: "/movers",
      keywords: ["Lightning Network", "node capacity", "channel growth", "Lightning rank"],
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Weekly movers", path: "/movers" },
    ]),
  ];

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ 03 · MOVERS</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="display text-[36px] md:text-[64px] leading-[0.9] text-paper">
              WEEKLY MOVERS
            </h1>
            <p className="ui text-[14px] md:text-[16px] text-paper-dim mt-3 max-w-2xl leading-relaxed">
              The biggest gains and losses in public capacity, channels, and rank
              over about seven days. Refreshed daily. {report.cohortSize > 0
                ? `${report.statsRead} of ${report.cohortSize} leader histories were read.`
                : "Waiting on the directory."}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 md:pb-2">
            <Link href="/nodes" className="mono-xs text-paper-dim hover:text-amber transition-colors">
              NODE DIRECTORY
            </Link>
            <Link href="/recommend" className="mono-xs text-paper-dim hover:text-amber transition-colors">
              WHO TO PEER WITH
            </Link>
          </div>
        </div>
      </div>

      <Board
        id="M01"
        kicker="MEMPOOL · 7 DAYS"
        title="CAPACITY"
        unit="BTC"
        split={report.capacity}
        value={(row) => signed(row.capacityDelta ?? 0, (n) => formatSats(n))}
        detail={(row) =>
          `${formatSats(row.capacitySats)} BTC now${row.capacityRank ? ` · #${row.capacityRank}` : ""}`
        }
      />
      <Board
        id="M02"
        kicker="MEMPOOL · 7 DAYS"
        title="CHANNELS"
        unit="CH"
        split={report.channels}
        value={(row) => signed(row.channelDelta ?? 0, (n) => formatNumber(n))}
        detail={(row) =>
          `${formatNumber(row.channels)} open now${row.connectivityRank ? ` · connectivity #${row.connectivityRank}` : ""}`
        }
      />
      <Board
        id="M03"
        kicker="AMBOSS · WEEKLY RANK"
        title="CAPACITY RANK"
        unit="PLACES"
        split={report.capacityRank}
        value={(row) => places(row.capacityRankChange ?? 0)}
        detail={(row) => `Now #${row.capacityRank ?? "—"}${row.alias ? "" : ""}`}
        emptyNote={
          report.flatCapacityRanks > 0
            ? `${report.flatCapacityRanks} listed nodes did not change capacity rank.`
            : undefined
        }
      />
      <Board
        id="M04"
        kicker="AMBOSS · WEEKLY RANK"
        title="CONNECTIVITY RANK"
        unit="PLACES"
        split={report.connectivityRank}
        value={(row) => places(row.connectivityRankChange ?? 0)}
        detail={(row) => `Now #${row.connectivityRank ?? "—"}`}
        emptyNote={
          report.flatConnectivityRanks > 0
            ? `${report.flatConnectivityRanks} listed nodes did not change connectivity rank.`
            : undefined
        }
      />

      <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8 rule-t">
        <div className="mono-xs text-paper-faint mb-3">HOW THIS IS BUILT</div>
        <ul className="space-y-3 max-w-3xl">
          {report.notes.map((note) => (
            <li key={note} className="ui text-[13px] text-paper-dim leading-relaxed">
              {note}
            </li>
          ))}
        </ul>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
    </div>
  );
}

function Board({
  id,
  kicker,
  title,
  unit,
  split,
  value,
  detail,
  emptyNote,
}: {
  id: string;
  kicker: string;
  title: string;
  unit: string;
  split: MoverSplit;
  value: (row: MoverRow) => string;
  detail: (row: MoverRow) => string;
  emptyNote?: string;
}) {
  return (
    <section className="rule-b">
      <div className="px-4 md:px-8 lg:px-12 py-4 flex items-end justify-between gap-3">
        <div>
          <div className="mono-xs text-paper-faint mb-1">
            <span className="text-amber">{id}</span> · {kicker}
          </div>
          <h2 className="display text-[28px] md:text-[40px] text-paper">{title}</h2>
        </div>
        <div className="mono-xs text-paper-faint">{unit}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-[1px] md:bg-[color:var(--rule)]">
        <Column label="GAINED" rows={split.gainers} value={value} detail={detail} positive />
        <Column label="LOST" rows={split.losers} value={value} detail={detail} positive={false} />
      </div>
      {emptyNote ? (
        <p className="px-4 md:px-8 lg:px-12 py-3 mono-xs text-paper-faint">{emptyNote}</p>
      ) : null}
    </section>
  );
}

function Column({
  label,
  rows,
  value,
  detail,
  positive,
}: {
  label: string;
  rows: MoverRow[];
  value: (row: MoverRow) => string;
  detail: (row: MoverRow) => string;
  positive: boolean;
}) {
  return (
    <div className="bg-ink px-4 md:px-8 lg:px-12 py-3">
      <div className={`mono-xs mb-2 ${positive ? "text-good" : "text-bad"}`}>{label}</div>
      {rows.length === 0 ? (
        <p className="ui text-[13px] text-paper-faint py-4">No moves in this set.</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.pubkey} className="rule-b last:border-0">
              <Link
                href={`/nodes/${row.pubkey}`}
                className="group flex items-baseline justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="ui text-[15px] text-paper truncate group-hover:text-amber transition-colors">
                    {row.alias}
                  </div>
                  <div className="mono-xs text-paper-faint mt-1 truncate">{detail(row)}</div>
                </div>
                <div
                  className={`mono tabular text-[13px] shrink-0 ${positive ? "text-good" : "text-bad"}`}
                >
                  {value(row)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function signed(n: number, format: (value: number) => string): string {
  if (n > 0) return `+${format(n)}`;
  if (n < 0) return `−${format(Math.abs(n))}`;
  return format(0);
}

function places(n: number): string {
  if (n > 0) return `▲ ${formatNumber(n)}`;
  if (n < 0) return `▼ ${formatNumber(Math.abs(n))}`;
  return "—";
}
