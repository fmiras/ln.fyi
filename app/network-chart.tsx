'use client'
import { LineChart, CartesianGrid, XAxis, Line, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function NetworkChart({ data }: { data: any[] }) {
  const chartData = data.map((stat) => ({
    date: new Date(stat.added * 1000).toLocaleDateString(),
    nodes: stat.node_count,
    capacity: parseFloat((stat.total_capacity / 100_000_000).toFixed(2))
  }))

  return (
    <ChartContainer
      className="w-full h-full"
      config={{
        nodes: {
          label: 'Total Nodes',
          color: 'hsl(var(--chart-1))'
        },
        capacity: {
          label: 'Total Capacity (BTC) ',
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
          tickFormatter={(value) => value.slice(0, 5)}
        />
        <YAxis
          dataKey="capacity"
          orientation="right"
          stroke="hsl(var(--chart-2))"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          domain={[4000, 6000]}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />

        <Line
          dataKey="capacity"
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
