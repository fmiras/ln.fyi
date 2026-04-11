'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { StatsVariation } from './actions'

export function NetworkChart({ data }: { data: StatsVariation[] }) {
  const chartData = useMemo(() => {
    return data
      .map((stat) => ({
        date: stat.added * 1000,
        capacity: Number((stat.total_capacity / 100_000_000).toFixed(2)),
        nodes: stat.node_count,
        channels: stat.channel_count
      }))
      .reverse()
  }, [data])

  const formatDate = (value: number) => {
    const d = new Date(value)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <ChartContainer
      className="w-full h-full aspect-auto"
      config={{
        capacity: {
          label: 'Capacity (BTC)',
          color: 'hsl(var(--chart-1))'
        }
      }}
    >
      <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
        <XAxis
          dataKey="date"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          minTickGap={40}
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          dataKey="capacity"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={44}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${Number(v).toLocaleString()}`}
          domain={['auto', 'auto']}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(value as number).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
              formatter={(value, name) => {
                if (name === 'capacity') return [`₿ ${Number(value).toLocaleString()}`, 'Capacity']
                return [value, name]
              }}
            />
          }
        />
        <Area
          dataKey="capacity"
          type="monotone"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          fill="url(#capacityGradient)"
          activeDot={{ r: 5, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
