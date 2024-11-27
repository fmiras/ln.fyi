import { ArrowUp, ArrowDown, Bitcoin, Zap, Network, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/mode-toggle'
import { getStats, getStatsVariations } from './actions'
import { NetworkChart } from './network-chart'

function StatsCard({
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
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default async function Home() {
  const stats = await getStats()
  const historicalStats = await getStatsVariations() // Get last month's data

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-6">
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            <a href="https://ln.fyi" className="hover:opacity-90 transition-opacity">
              <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
            </a>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">network stats</span>
          </div>
          <ModeToggle />
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Nodes"
            value={stats.latest.node_count.toLocaleString()}
            change={stats.latest.node_count - stats.previous.node_count}
            previousValue={stats.previous.node_count}
            icon={<Users className="h-4 w-4 text-orange-500" />}
          />

          <StatsCard
            title="Total Channels"
            value={stats.latest.channel_count.toLocaleString()}
            change={stats.latest.channel_count - stats.previous.channel_count}
            previousValue={stats.previous.channel_count}
            icon={<Network className="h-4 w-4 text-orange-500" />}
          />

          <StatsCard
            title="Total Capacity"
            value={`₿ ${(stats.latest.total_capacity / 100_000_000).toLocaleString()}`}
            change={stats.latest.total_capacity - stats.previous.total_capacity}
            previousValue={stats.previous.total_capacity}
            format="btc"
            icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
          />

          <StatsCard
            title="Average Capacity"
            value={`₿ ${(stats.latest.avg_capacity / 100_000_000).toLocaleString()}`}
            change={stats.latest.avg_capacity - stats.previous.avg_capacity}
            previousValue={stats.previous.avg_capacity}
            format="btc"
            icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
          />

          <StatsCard
            title="Average Fee Rate"
            value={`${stats.latest.avg_fee_rate} ppm`}
            change={stats.latest.avg_fee_rate - stats.previous.avg_fee_rate}
            previousValue={stats.previous.avg_fee_rate}
            icon={<Zap className="h-4 w-4 text-orange-500" />}
          />

          <StatsCard
            title="Median Base Fee"
            value={`${stats.latest.med_base_fee_mtokens} msat`}
            change={stats.latest.med_base_fee_mtokens - stats.previous.med_base_fee_mtokens}
            previousValue={stats.previous.med_base_fee_mtokens}
            icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-orange-500" />
                Node Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                  <p className="text-sm text-muted-foreground">Tor Nodes</p>
                  <p className="text-xl font-bold text-orange-500">
                    {stats.latest.tor_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                  <p className="text-sm text-muted-foreground">Clearnet Nodes</p>
                  <p className="text-xl font-bold text-orange-500">
                    {stats.latest.clearnet_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                  <p className="text-sm text-muted-foreground">Hybrid Nodes</p>
                  <p className="text-xl font-bold text-orange-500">
                    {stats.latest.clearnet_tor_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                  <p className="text-sm text-muted-foreground">Unannounced</p>
                  <p className="text-xl font-bold text-orange-500">
                    {stats.latest.unannounced_nodes.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Network Capacity (BTC)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <NetworkChart data={historicalStats} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
