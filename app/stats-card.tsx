import { ArrowUp, ArrowDown, HelpCircle } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function StatsCard({
  title,
  value,
  change,
  previousValue,
  icon,
  tooltip
}: {
  title: string
  value: string
  change: number
  previousValue: number
  format?: 'number' | 'btc'
  icon?: React.ReactNode
  tooltip?: string
}) {
  const percentChange = ((change / previousValue) * 100).toFixed(2)
  const isPositive = change > 0

  const titleContent = (
    <CardTitle className="text-sm font-medium flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {icon}
        {title}
      </div>
      {tooltip && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
    </CardTitle>
  )

  return (
    <Card className="border-orange-500/20 transition-all hover:border-orange-500/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {tooltip ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{titleContent}</TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px]">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          titleContent
        )}
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
