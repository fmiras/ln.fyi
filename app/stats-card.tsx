import { ArrowUp, ArrowDown } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StatsCard({
  title,
  value,
  change,
  previousValue,
  icon
}: {
  title: string
  value: string
  change: number
  previousValue: number
  format?: 'number' | 'btc'
  icon?: React.ReactNode
}) {
  const percentChange = ((change / previousValue) * 100).toFixed(2)
  const isPositive = change > 0

  return (
    <Card className="border-orange-500/20 transition-all hover:border-orange-500/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {change !== 0 && (
          <Badge
            variant={isPositive ? 'default' : 'secondary'}
            className={`px-2 py-1 ${
              isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {isPositive ? (
              <ArrowUp className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDown className="mr-1 h-4 w-4" />
            )}
            {percentChange}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
