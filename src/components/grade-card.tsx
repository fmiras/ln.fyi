import Link from "next/link";
import {
  FEE_NOTE,
  GRADE_METHOD,
  formatCount,
  letterColor,
  type FeeMark,
  type NodeGrade,
} from "@/lib/grade";
import { ShareGrade } from "./share-grade";

export function GradeCard({
  grade,
  fee,
  intentHref,
  shareUrl,
}: {
  grade: NodeGrade;
  fee: FeeMark | null;
  intentHref: string;
  shareUrl: string;
}) {
  const color = letterColor(grade.letter);
  return (
    <section
      id="report-card"
      aria-label={`Report card ${grade.letter}, ${grade.score} out of 100`}
      className="rule-b px-4 md:px-6 lg:px-8 py-3 md:py-4 shrink-0"
      data-grade={grade.letter}
      data-score={grade.score}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8">
        <div className="flex items-end gap-3 shrink-0">
          <div
            className="display tabular text-[64px] md:text-[72px] leading-[0.8]"
            style={{ color }}
          >
            {grade.letter}
          </div>
          <div className="pb-1">
            <div className="mono-xs text-paper-faint mb-1">REPORT CARD</div>
            <div className="display tabular text-[22px] leading-none text-paper">
              {grade.score}
              <span className="text-paper-faint">/100</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 flex-1 min-w-0">
          {grade.factors.map((factor) => (
            <div key={factor.key} className="min-w-0">
              <dt className="mono-xs text-paper-faint truncate">
                {factor.label} · {factor.weight}
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
              <p className="ui text-[11px] leading-snug text-paper-dim mt-1.5">
                {factor.detail}
              </p>
            </div>
          ))}
        </dl>
      </div>

      <p className="ui text-[12.5px] md:text-[13px] leading-relaxed text-paper-dim max-w-4xl mt-4">
        {GRADE_METHOD}
      </p>

      {fee && (
        <p className="ui text-[12.5px] leading-relaxed text-paper-dim max-w-4xl mt-2">
          <span className="mono-xs text-paper-faint mr-2">FEE SAMPLE {fee.score}</span>
          Median {formatCount(fee.medianPpm)} ppm on {formatCount(fee.sampleSize)} open
          channels already loaded here, versus {formatCount(fee.networkMedianPpm)} ppm
          network median. {FEE_NOTE}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ShareGrade intentHref={intentHref} shareUrl={shareUrl} />
        <Link
          href="/grades"
          className="mono-xs text-paper-faint hover:text-amber focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
        >
          TOP 20 GRADES →
        </Link>
      </div>
    </section>
  );
}
