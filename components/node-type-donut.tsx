'use client'

type Slice = {
  label: string
  value: number
  color: string
  tooltip?: string
}

export function NodeTypeDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1

  let cumulative = 0
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const center = 60

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="h-32 w-32 sm:h-36 sm:w-36 -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="14"
          />
          {data.map((slice) => {
            const pct = slice.value / total
            const dash = pct * circumference
            const gap = circumference - dash
            const offset = -cumulative * circumference
            cumulative += pct
            return (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            nodes
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 w-full text-sm">
        {data.map((slice) => {
          const pct = ((slice.value / total) * 100).toFixed(1)
          return (
            <li
              key={slice.label}
              className="flex items-center justify-between gap-3 rounded-md py-1"
              title={slice.tooltip}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-muted-foreground truncate">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {pct}%
                </span>
                <span className="font-mono tabular-nums text-foreground">
                  {slice.value.toLocaleString()}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
