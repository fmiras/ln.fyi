import Link from "next/link";
import { LETTER_BANDS, gradeTone, type NodeGrade } from "@/lib/grade";
import { SITE_URL } from "@/lib/seo";
import { ShareBar } from "./share-bar";

const TONE_CLASS = {
  good: "text-good",
  paper: "text-paper",
  amber: "text-amber",
  bad: "text-bad",
} as const;

export function ReportCard({
  grade,
  alias,
  pubkey,
  color,
  aside,
  layout = "band",
}: {
  grade: NodeGrade;
  alias: string;
  pubkey: string;
  color?: string;
  aside?: string;
  layout?: "band" | "poster";
}) {
  const key = pubkey.toLowerCase();
  const cardUrl = `${SITE_URL}/nodes/${key}/card`;
  const tone = TONE_CLASS[gradeTone(grade.letter)];
  const accent = color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#ff8a3d";
  const poster = layout === "poster";
  const shareText = `${alias} rates ${grade.letter} (${grade.score}/100) on ln.fyi. ${grade.summary}\n${cardUrl}`;
  const scale = LETTER_BANDS.map((band) =>
    band.letter === "F" ? "F <60" : `${band.letter} ${band.min}`,
  ).join(" · ");

  return (
    <section
      id="report"
      className={
        poster
          ? "crosshair bg-ink px-4 md:px-8 lg:px-12 py-8 md:py-12"
          : "bg-ink rule-b px-4 md:px-6 lg:px-8 py-5 md:py-6"
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="lg:col-span-5 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: accent, boxShadow: `0 0 10px ${accent}88` }}
            />
            <div className="mono-xs text-amber">§ NODE REPORT</div>
          </div>
          <div className="flex items-end gap-4">
            <div
              className={`display tabular leading-[0.8] ${tone} ${
                poster ? "text-[108px] md:text-[148px]" : "text-[84px] md:text-[108px]"
              }`}
            >
              {grade.letter}
            </div>
            <div className="pb-1">
              <div className="display tabular text-[28px] md:text-[36px] leading-none text-paper">
                {grade.score}
                <span className="text-paper-faint text-[16px] md:text-[18px]">/100</span>
              </div>
              <div className="mono-xs text-paper-faint mt-2">WEIGHTED SCORE</div>
            </div>
          </div>
          <p className="ui text-[14px] md:text-[15px] text-paper mt-4 max-w-md leading-relaxed">
            {grade.summary}
          </p>
          {aside ? (
            <p className="ui text-[12px] text-paper-dim mt-3 max-w-md leading-relaxed">{aside}</p>
          ) : null}
          <div className="mt-4">
            <ShareBar url={cardUrl} text={shareText} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {poster ? (
              <Link href={`/nodes/${key}`} className="mono-xs text-paper-dim hover:text-amber transition-colors">
                FULL PROFILE
              </Link>
            ) : (
              <Link
                href={`/nodes/${key}/card`}
                className="mono-xs text-paper-dim hover:text-amber transition-colors"
              >
                OPEN THE CARD
              </Link>
            )}
            <Link
              href={`/recommend/${key}`}
              rel="nofollow"
              prefetch={false}
              className="mono-xs text-paper-dim hover:text-amber transition-colors"
            >
              WHO TO PEER WITH
            </Link>
            <Link
              href="/movers"
              prefetch={false}
              className="mono-xs text-paper-dim hover:text-amber transition-colors"
            >
              WEEKLY MOVERS
            </Link>
          </div>
          <p className="mono-xs text-paper-faint mt-4 leading-relaxed max-w-md">{scale}</p>
        </div>

        <div className="lg:col-span-7 min-w-0">
          <ul>
            {grade.factors.map((factor) => (
              <li key={factor.id} className="py-2.5 rule-b last:border-0">
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <div className="mono-xs text-paper-faint">
                    {factor.label} · {factor.weight}%
                    {!factor.known ? " · NEUTRAL" : ""}
                  </div>
                  <div className="mono tabular text-[12px] text-paper">{factor.score}</div>
                </div>
                <div className="h-[3px] bg-[color:var(--rule)] mb-1.5" aria-hidden>
                  <div className="h-full bg-amber" style={{ width: `${factor.score}%` }} />
                </div>
                <p className="ui text-[13px] text-paper leading-snug">{factor.detail}</p>
                <p className="ui text-[12px] text-paper-faint leading-snug mt-1">{factor.rule}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
