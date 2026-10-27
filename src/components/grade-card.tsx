import Link from "next/link";
import {
  GRADE_METHOD,
  GRADE_SUMMARY,
  feeComparison,
  gradeStamp,
  heldBackLine,
  letterColor,
  percentileLine,
  type FeeMark,
  type NodeGrade,
} from "@/lib/grade";
import { ShareGrade } from "./share-grade";

export function GradeCard({
  grade,
  fee,
  intentHref,
  shareUrl,
  shareText,
  primaryLabel,
  asOf,
  percentile,
}: {
  grade: NodeGrade;
  fee: FeeMark | null;
  intentHref: string;
  shareUrl: string;
  shareText: string;
  primaryLabel: string;
  asOf: number;
  percentile: number | null;
}) {
  const color = letterColor(grade.letter);
  const heldBack = heldBackLine(grade);
  return (
    <section
      id="report-card"
      aria-label={`Report card ${grade.letter}, ${grade.score} out of 100`}
      className="rule-b px-4 md:px-6 lg:px-8 py-3 md:py-4 shrink-0"
      data-grade={grade.letter}
      data-score={grade.score}
    >
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-10 lg:items-start">
        <div className="flex items-end gap-3">
          <div
            className="display tabular text-[64px] md:text-[72px] leading-[0.8]"
            style={{ color }}
          >
            {grade.letter}
          </div>
          <div className="pb-1">
            <div className="font-mono text-[12px] tracking-[0.14em] uppercase text-paper-dim mb-1">
              Report card
            </div>
            <div className="display tabular text-[22px] leading-none text-paper">
              {grade.score}
              <span className="text-paper-dim">/100</span>
            </div>
            <p className="font-mono text-[12px] text-paper-dim mt-1.5">{gradeStamp(asOf)}</p>
          </div>
        </div>

        <div className="lg:col-start-1">
          {heldBack && (
            <p className="text-[13px] leading-snug text-paper-dim mb-1">{heldBack}</p>
          )}
          {percentile != null && (
            <p className="text-[13px] leading-snug text-paper mb-2">{percentileLine(percentile)}</p>
          )}
          <ShareGrade
            intentHref={intentHref}
            shareUrl={shareUrl}
            shareText={shareText}
            primaryLabel={primaryLabel}
          />
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          {grade.factors.map((factor) => (
            <div key={factor.key} className="min-w-0">
              <dt className="font-mono text-[12px] text-paper-dim truncate">
                {factor.label} ({factor.weight}%)
              </dt>
              <dd className="display tabular text-[22px] leading-none text-paper mt-1">
                {factor.score}
              </dd>
              <div className="mt-1.5 h-px bg-[color:var(--rule-strong)]">
                <div
                  className="h-px"
                  style={{ width: `${factor.score}%`, background: color }}
                />
              </div>
              <p className="text-[12px] leading-snug text-paper-dim mt-1.5">{factor.detail}</p>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[13px] leading-relaxed text-paper-dim max-w-3xl mt-3">{GRADE_SUMMARY}</p>
      <details className="mt-2 max-w-3xl">
        <summary className="cursor-pointer font-mono text-[12px] text-paper-dim hover:text-paper">
          How grades work
        </summary>
        <p className="text-[13px] leading-relaxed text-paper-dim mt-2">{GRADE_METHOD}</p>
      </details>

      {fee && (
        <p className="text-[13px] leading-relaxed text-paper-dim max-w-3xl mt-3">{feeComparison(fee)}</p>
      )}
      <Link
        href="/grades"
        className="inline-block mt-3 font-mono text-[12px] text-paper-dim hover:text-amber"
      >
        Top 20 grades
      </Link>
    </section>
  );
}
