export function Section({
  num,
  title,
  kicker,
  children,
  right,
}: {
  num: string;
  title: string;
  kicker?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="relative">
      <div className="rule-t">
        <div className="flex items-start justify-between gap-6 py-6">
          <div className="flex items-baseline gap-4">
            <span className="mono-xs text-amber pt-1">§ {num}</span>
            <div>
              {kicker && (
                <div className="mono-xs text-paper-faint mb-2">{kicker}</div>
              )}
              <h2 className="display text-4xl md:text-5xl text-paper">{title}</h2>
            </div>
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="mono-xs text-paper-faint">{children}</div>;
}
