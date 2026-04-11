import Link from "next/link";

/**
 * Control-room panel — boxed card with a header strip and a body region.
 * Used across the dashboard grid to contain charts, tables, metrics.
 */
export function Panel({
  id,
  title,
  meta,
  href,
  children,
  className = "",
}: {
  id: string;
  title: string;
  meta?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel flex flex-col overflow-hidden ${className}`}>
      <header className="panel-header shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="mono-xs text-amber shrink-0">{id}</span>
          <span className="mono-xs text-paper truncate">{title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {meta && <div className="mono-xs text-paper-faint tabular">{meta}</div>}
          {href && (
            <Link
              href={href}
              className="mono-xs text-paper-faint hover:text-amber transition-colors"
            >
              ↗
            </Link>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </section>
  );
}

/**
 * Compact KPI block — small label top, large display number centered, optional delta/sub bottom.
 * All cells render at the same height with vertically centered content.
 */
export function KPI({
  label,
  value,
  unit,
  delta,
  sub,
  tooltip,
  deltaLabel = "30D",
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  sub?: string;
  tooltip?: string;
  deltaLabel?: string;
}) {
  const deltaStr =
    delta == null ? null : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%`;
  const deltaColor =
    delta == null
      ? "text-paper-faint"
      : delta > 0
      ? "text-good"
      : delta < 0
      ? "text-bad"
      : "text-paper-faint";

  return (
    <div
      className="group relative px-4 py-4 h-full min-w-0 flex flex-col justify-center items-start gap-1.5"
      title={tooltip}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="mono-xs text-paper-faint truncate">{label}</span>
        {tooltip && (
          <span className="mono-xs text-paper-faint/40 group-hover:text-amber transition-colors cursor-help">
            ⓘ
          </span>
        )}
      </div>
      <div className="display tabular text-paper text-[34px] leading-none truncate w-full">
        {value}
        {unit && (
          <span className="mono text-[11px] text-paper-dim ml-1.5 tracking-wide">
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 min-h-[14px]">
        {deltaStr && (
          <span className={`mono-xs tabular ${deltaColor}`}>
            {deltaStr}
            <span className="text-paper-faint/70 ml-1">{deltaLabel}</span>
          </span>
        )}
        {sub && (
          <span className="mono-xs text-paper-faint tabular truncate">
            {deltaStr ? "· " : ""}
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
