export function Stat({
  label,
  value,
  suffix,
  delta,
  sub,
  big,
}: {
  label: string;
  value: string;
  suffix?: string;
  delta?: number;
  sub?: string;
  big?: boolean;
}) {
  const deltaSign = delta && delta > 0 ? "+" : "";
  const deltaColor =
    delta === undefined
      ? "text-paper-faint"
      : delta > 0
      ? "text-good"
      : delta < 0
      ? "text-bad"
      : "text-paper-faint";

  return (
    <div className="group relative py-6 px-5 rule-b hover:bg-[#ffffff03] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="mono-xs text-paper-faint">{label}</div>
        {delta !== undefined && (
          <div className={`mono-xs tabular ${deltaColor}`}>
            {deltaSign}
            {delta.toFixed(2)}%
          </div>
        )}
      </div>
      <div
        className={`display tabular text-paper ${
          big ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl"
        }`}
      >
        {value}
        {suffix && (
          <span className="mono text-sm text-paper-dim ml-2 tracking-wide">
            {suffix}
          </span>
        )}
      </div>
      {sub && (
        <div className="mono-xs text-paper-faint mt-3 tabular">{sub}</div>
      )}
    </div>
  );
}
