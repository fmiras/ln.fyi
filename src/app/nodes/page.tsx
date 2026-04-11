import Link from "next/link";
import { api, safe, formatSats, formatNumber, shortKey, relTime } from "@/lib/api";

export const revalidate = 600;

type Rank = "liquidity" | "connectivity" | "age";

export default async function NodesPage({
  searchParams,
}: {
  searchParams: Promise<{ rank?: string }>;
}) {
  const sp = await searchParams;
  const rank: Rank =
    sp.rank === "connectivity" || sp.rank === "age" ? sp.rank : "liquidity";

  const [liq, conn, oldest] = await Promise.all([
    safe(api.topByCapacity()),
    safe(api.topByConnectivity()),
    safe(api.oldest()),
  ]);

  const active =
    rank === "liquidity" ? liq ?? [] : rank === "connectivity" ? conn ?? [] : oldest ?? [];

  const tabs: { key: Rank; label: string; kicker: string }[] = [
    { key: "liquidity", label: "LIQUIDITY", kicker: "By capacity" },
    { key: "connectivity", label: "CONNECTIVITY", kicker: "By channels" },
    { key: "age", label: "AGE", kicker: "By first seen" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Page header */}
      <div className="rule-b px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="mono-xs text-amber mb-2">§ 02 · NODES</div>
          <h1 className="display text-[32px] md:text-[52px] leading-none text-paper">
            EVERY PUBLIC NODE
          </h1>
          <p className="ui text-[12px] md:text-[13px] text-paper-dim mt-2 max-w-xl">
            Top one hundred Lightning nodes by liquidity, connectivity or age.
            Tap any row to open its profile.
          </p>
        </div>
        <div className="mono-xs text-paper-faint tabular md:pb-1">
          {active.length} NODES · LIVE
        </div>
      </div>

      {/* Rank tabs */}
      <div className="rule-b flex items-stretch">
        {tabs.map((t, idx) => {
          const isActive = rank === t.key;
          return (
            <Link
              key={t.key}
              href={`/nodes?rank=${t.key}`}
              className={`flex-1 group px-3 md:px-5 py-3 md:py-4 transition-colors ${
                isActive ? "bg-[#ffffff05]" : "hover:bg-[#ffffff02]"
              } ${idx !== tabs.length - 1 ? "rule-r" : ""}`}
              scroll={false}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="mono-xs text-paper-faint mb-1 md:mb-1.5 truncate">
                    {t.kicker.toUpperCase()}
                  </div>
                  <div
                    className={`display text-[18px] md:text-[28px] leading-none truncate ${
                      isActive ? "text-paper" : "text-paper-faint group-hover:text-paper"
                    }`}
                  >
                    {t.label}
                  </div>
                </div>
                <span
                  className={`mono-xs shrink-0 ${
                    isActive ? "text-amber" : "text-paper-faint"
                  }`}
                >
                  {isActive ? "◆" : "◇"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Table header — hidden on mobile, table on md+ */}
      <div className="hidden md:grid grid-cols-12 mono-xs text-paper-faint py-2.5 px-4 md:px-6 rule-b bg-panel">
        <div className="col-span-1">#</div>
        <div className="col-span-5">NODE</div>
        <div className="col-span-2 text-right">CAPACITY</div>
        <div className="col-span-2 text-right">CHANNELS</div>
        <div className="col-span-2 text-right">FIRST SEEN</div>
      </div>

      {/* Rows */}
      <div className="flex-1">
        {active.map((n, i) => {
          const firstSeen = (n as { firstSeen?: number }).firstSeen;
          return (
            <Link
              key={n.publicKey}
              href={`/nodes/${n.publicKey}`}
              className="group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-0 py-3 md:py-2.5 rule-b hover:bg-[#ffffff05] active:bg-[#ffffff08] px-4 md:px-6 transition-colors"
            >
              <div className="md:col-span-1 mono-xs tabular text-paper-faint shrink-0 w-8 md:w-auto">
                {String(i + 1).padStart(3, "0")}
              </div>
              <div className="flex-1 md:col-span-5 min-w-0 md:pr-4">
                <div className="ui text-[14px] text-paper truncate group-hover:text-amber transition-colors">
                  {n.alias || "—"}
                </div>
                <div className="mono-xs text-paper-faint tabular truncate">
                  {shortKey(n.publicKey)}
                </div>
              </div>
              <div className="shrink-0 md:col-span-2 text-right mono tabular text-paper text-[13px]">
                {formatSats(n.capacity)}
                <span className="text-paper-faint ml-1 text-[10px]">BTC</span>
                <div className="md:hidden mono-xs text-paper-faint tabular">
                  {formatNumber(n.channels)} ch
                  {firstSeen && ` · ${relTime(firstSeen)}`}
                </div>
              </div>
              <div className="hidden md:block md:col-span-2 text-right mono tabular text-paper text-[13px]">
                {formatNumber(n.channels)}
              </div>
              <div className="hidden md:block md:col-span-2 text-right mono-xs tabular text-paper-dim">
                {firstSeen ? relTime(firstSeen) : "—"}
              </div>
            </Link>
          );
        })}
        {active.length === 0 && (
          <div className="py-20 text-center mono-xs text-paper-faint">
            Rankings temporarily unavailable.
          </div>
        )}
      </div>
    </div>
  );
}
