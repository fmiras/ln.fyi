'use client'

import { ArrowUp, ArrowDown, HelpCircle, Minus } from 'lucide-react'
import { useState } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function StatsCard({
  title,
  value,
  hoverValue,
  change,
  previousValue,
  icon,
  tooltip,
  subtitle
}: {
  title: string
  value: string
  hoverValue?: string
  change: number
  previousValue: number
  format?: 'number' | 'btc'
  icon?: React.ReactNode
  tooltip?: string
  subtitle?: string
}) {
  const [hover, setHover] = useState(false)
  const safeDenominator = previousValue || 1
  const percentChange = ((change / safeDenominator) * 100).toFixed(2)
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 transition-all hover:border-orange-500/40 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.1),0_8px_40px_-16px_hsl(var(--primary)/0.25)]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              {icon}
            </div>
          )}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {title}
            </span>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold shrink-0 ${
            isNeutral
              ? 'bg-muted text-muted-foreground'
              : isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {isNeutral ? (
            <Minus className="h-3 w-3" />
          ) : isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {isNeutral ? '0%' : `${Math.abs(Number(percentChange))}%`}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-balance">
          {hover && hoverValue ? hoverValue : value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>
    </div>
  )
}
