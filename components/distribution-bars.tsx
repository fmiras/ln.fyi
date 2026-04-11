'use client'

import { useMemo } from 'react'

type Item = {
  label: string
  value: number
  hint?: string
}

export function DistributionBars({
  items,
  formatValue = (v) => v.toLocaleString(),
  colorIndex = 0
}: {
  items: Item[]
  formatValue?: (v: number) => string
  colorIndex?: 0 | 1 | 2 | 3 | 4
}) {
  const max = useMemo(() => Math.max(...items.map((i) => i.value), 1), [items])
  const colors = [
    'from-orange-400 to-orange-600',
    'from-emerald-400 to-emerald-600',
    'from-sky-400 to-sky-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600'
  ]
  const color = colors[colorIndex]

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const pct = (item.value / max) * 100
        return (
          <li key={`${item.label}-${i}`} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground w-5 tabular-nums text-right">
                  {i + 1}
                </span>
                <span className="font-medium truncate">{item.label}</span>
                {item.hint && (
                  <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                    {item.hint}
                  </span>
                )}
              </div>
              <span className="font-mono text-foreground shrink-0 ml-2 tabular-nums">
                {formatValue(item.value)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
