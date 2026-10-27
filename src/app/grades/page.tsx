import Link from "next/link";
import { formatNumber, formatSats, shortKey } from "@/lib/api";
import { getGradeSnapshot } from "@/lib/grade-data";
import {
  FEE_NOTE,
  GRADE_METHOD,
  GRADE_SUMMARY,
  gradeStamp,
  letterColor,
  topGraded,
  TOP_GRADE_COUNT,
} from "@/lib/grade";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const maxDuration = 15;

export const metadata = buildMetadata({
  title: "Top 20 Lightning node grades",
  description:
    "The top 20 public Lightning nodes by ln.fyi's report card: capacity, channels, connectivity rank, and age, scored from the daily ranking snapshot.",
  path: "/grades",
  image: absoluteUrl("/grades/opengraph-image"),
});

export default async function GradesPage() {
  const snapshot = await getGradeSnapshot();
  const now = Math.floor(Date.now() / 1000);
  const top = snapshot ? topGraded(snapshot, now, TOP_GRADE_COUNT) : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="rule-b px-4 md:px-6 py-4 md:py-5">
        <div className="font-mono text-[12px] tracking-[0.14em] uppercase text-amber mb-2">
          § 03 · Grades
        </div>
        <h1 className="display text-[32px] md:text-[52px] leading-none text-paper">
          TOP {TOP_GRADE_COUNT} REPORT CARDS
        </h1>
        <p className="text-[13px] md:text-[14px] leading-relaxed text-paper-dim mt-3 max-w-3xl">
          {GRADE_SUMMARY}
        </p>
        {snapshot && (
          <p className="font-mono text-[12px] text-paper-dim mt-2">{gradeStamp(snapshot.asOf)}</p>
        )}
        <details id="method" className="mt-3 max-w-3xl">
          <summary className="cursor-pointer font-mono text-[12px] text-paper-dim hover:text-paper">
            How grades work
          </summary>
          <p className="text-[13px] leading-relaxed text-paper-dim mt-2">{GRADE_METHOD}</p>
          <p className="text-[13px] leading-relaxed text-paper-dim mt-2">{FEE_NOTE}</p>
        </details>
      </div>

      <div className="hidden md:grid grid-cols-12 font-mono text-[12px] uppercase tracking-[0.12em] text-paper-dim py-2.5 px-4 md:px-6 rule-b bg-panel">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Score</div>
        <div className="col-span-5">Node</div>
        <div className="col-span-2 text-right">Capacity</div>
        <div className="col-span-2 text-right">Channels</div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {top.length === 0 ? (
          <div className="px-4 md:px-6 py-10">
            <p className="text-[14px] text-paper-dim max-w-md">
              The ranking snapshot did not load. This list will fill in on the
              next refresh.
            </p>
          </div>
        ) : (
          top.map((row, index) => {
            const color = letterColor(row.grade.letter);
            return (
              <Link
                key={row.node.publicKey}
                href={`/nodes/${row.node.publicKey}`}
                className="group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-0 py-3 md:py-2.5 rule-b hover:bg-[#ffffff05] active:bg-[#ffffff08] px-4 md:px-6 transition-colors"
              >
                <div className="hidden md:block md:col-span-1 font-mono text-[12px] tabular text-paper-dim">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="md:col-span-2 flex items-baseline gap-2 shrink-0">
                  <span className="display tabular text-[28px] md:text-[26px] leading-none text-paper">
                    {row.grade.score}
                  </span>
                  <span className="display tabular text-[16px] leading-none" style={{ color }}>
                    {row.grade.letter}
                  </span>
                </div>
                <div className="min-w-0 flex-1 md:col-span-5">
                  <div className="text-[14px] text-paper truncate group-hover:text-amber transition-colors">
                    {row.node.alias || "Anonymous"}
                  </div>
                  <div className="font-mono text-[12px] text-paper-dim tabular mt-1">
                    {shortKey(row.node.publicKey)}
                  </div>
                </div>
                <div className="hidden md:block md:col-span-2 text-right font-mono text-[12px] tabular text-paper">
                  {formatSats(row.node.capacity)} BTC
                </div>
                <div className="hidden md:block md:col-span-2 text-right font-mono text-[12px] tabular text-paper">
                  {formatNumber(row.node.channels)}
                </div>
                <div className="md:hidden ml-auto text-right shrink-0">
                  <div className="font-mono text-[12px] tabular text-paper">
                    {formatSats(row.node.capacity)} BTC
                  </div>
                  <div className="font-mono text-[12px] text-paper-dim tabular mt-1">
                    {formatNumber(row.node.channels)} ch
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
