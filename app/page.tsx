import { ArrowUp, ArrowDown, Bitcoin, Zap, Network, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/mode-toggle'
import { getStats } from './actions'

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative mx-auto space-y-8 p-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 p-2 flex items-center justify-center">
              <Bitcoin className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <a href="https://ln.fyi">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                    ln.fyi
                  </h1>
                </a>
                <span className="text-muted-foreground">Lightning Network Stats</span>
              </div>
              <p className="text-muted-foreground">
                Statistics for {new Date(stats.latest.added).toLocaleDateString()}
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>

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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-orange-500" />
                Node Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Tor Nodes</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.latest.tor_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Clearnet Nodes</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.latest.clearnet_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Hybrid Nodes</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.latest.clearnet_tor_nodes.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-orange-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Unannounced</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.latest.unannounced_nodes.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Network Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] rounded-lg bg-orange-500/5 flex items-center justify-center">
                <p className="text-muted-foreground">Network Growth Chart Coming Soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* <footer className="container mx-auto p-8 border-t border-orange-500/20">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <a href="/about" className="hover:text-orange-500 transition-colors">
              About
            </a>
            <a href="/api" className="hover:text-orange-500 transition-colors">
              API
            </a>
            <a
              href="https://github.com/yourusername/ln.fyi"
              className="hover:text-orange-500 transition-colors"
            >
              GitHub
            </a>
          </div>
          <p>© {new Date().getFullYear()} ln.fyi</p>
        </div>
      </footer> */}
    </div>
  )
}

function StatsCard({
  title,
  value,
  change,
  previousValue,
  format = 'number',
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
