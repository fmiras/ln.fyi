'use client'
import { LineChart, CartesianGrid, XAxis, Line, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { StatsVariation } from './actions'

export function NetworkChart({ data }: { data: StatsVariation[] }) {
  const chartData = data
    .map((stat) => ({
      date: new Date(stat.added * 1000).toLocaleDateString(),
      nodes: stat.node_count,
      channels: stat.channel_count
    }))
    .reverse()

  return (
    <ChartContainer
      className="w-full h-full"
      config={{
        nodes: {
          label: 'Total Nodes',
          color: 'hsl(var(--chart-1))'
        },
        channels: {
          label: 'Total Channels',
          color: 'hsl(var(--chart-2))'
        }
      }}
    >
      <LineChart
        data={chartData}
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
        width={500}
        height={300}
      >
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.2} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          stroke="hsl(var(--foreground))"
          tickFormatter={(value) => {
            // Assuming value is in format "MM/DD/YYYY"
            return value.split('/').slice(0, 2).join('/') // Only keep MM/DD
          }}
          interval={6}
        />
        <YAxis
          dataKey="channels"
          orientation="right"
          stroke="hsl(var(--chart-2))"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />

        <Line
          dataKey="channels"
          type="monotone"
          stroke="hsl(var(--chart-2))"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: 'hsl(var(--chart-2))' }}
        />
      </LineChart>
    </ChartContainer>
  )
}
