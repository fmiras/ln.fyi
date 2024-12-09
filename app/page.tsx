import Link from 'next/link'
import { Bitcoin, Zap, Network, Users, Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { IntervalToggle } from '@/components/interval-toggle'
import { getNodesRanking, getStats, getStatsVariations, StatsVariation } from './actions'
import { NetworkChart } from './network-chart'
import { Interval, INTERVALS } from '../lib/types'
import { StatsCard } from './stats-card'

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ interval?: string }>
}) {
  const stats = await getStats()

  const search = await searchParams
  const interval = search.interval
    ? INTERVALS.includes(search.interval)
      ? (search.interval as Interval)
      : '3m'
    : '3m'

  const historicalStats = await getStatsVariations(interval)
  const previous: StatsVariation | null = historicalStats.reduce(
    (acc, curr) => (acc.added < curr.added ? acc : curr),
    historicalStats[0] || null
  )
  console.debug('[getStatsVariations] previous', previous)

  const { topByCapacity, topByChannels } = await getNodesRanking()

  return (
    <article
      className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center"
      aria-label="Lightning Network Statistics"
    >
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-8">
        <nav className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="Home">
              <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              network stats
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <IntervalToggle currentInterval={interval} />
            <ModeToggle />
          </div>
        </nav>

        <div className="space-y-6">
          <section aria-labelledby="network-stats" className="w-full flex flex-col gap-4">
            <h2
              id="network-stats"
              className="text-lg font-semibold flex items-center gap-2 text-orange-500"
            >
              Network Statistics
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Total Nodes"
                value={stats.latest.node_count.toLocaleString()}
                change={previous ? stats.latest.node_count - previous.node_count : 0}
                previousValue={previous ? previous.node_count : stats.latest.node_count}
                icon={<Users className="h-4 w-4 text-orange-500" />}
              />
              <StatsCard
                title="Total Channels"
                value={stats.latest.channel_count.toLocaleString()}
                change={previous ? stats.latest.channel_count - previous.channel_count : 0}
                previousValue={previous ? previous.channel_count : stats.latest.channel_count}
                icon={<Network className="h-4 w-4 text-orange-500" />}
              />
              <StatsCard
                title="Total Capacity"
                value={`₿ ${(stats.latest.total_capacity / 100_000_000).toLocaleString()}`}
                change={previous ? stats.latest.total_capacity - previous.total_capacity : 0}
                previousValue={previous ? previous.total_capacity : stats.latest.total_capacity}
                format="btc"
                icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3 w-full">
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Node Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                      <p className="text-sm text-muted-foreground">Tor</p>
                      <p className="text-xl font-bold text-orange-500">
                        {stats.latest.tor_nodes.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                      <p className="text-sm text-muted-foreground">Clearnet</p>
                      <p className="text-xl font-bold text-orange-500">
                        {stats.latest.clearnet_nodes.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-orange-500/5 p-3">
                      <p className="text-sm text-muted-foreground">Hybrid</p>
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
                  <CardTitle className="flex items-center gap-2">Network Channels</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <NetworkChart data={historicalStats} />
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-labelledby="channel-stats">
            <h2
              id="channel-stats"
              className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500"
            >
              Channel Statistics
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Average Capacity"
                value={`₿ ${(stats.latest.avg_capacity / 100_000_000).toLocaleString()}`}
                change={
                  stats.previous ? stats.latest.avg_capacity - stats.previous.avg_capacity : 0
                }
                previousValue={
                  stats.previous ? stats.previous.avg_capacity : stats.latest.avg_capacity
                }
                format="btc"
                icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
              />
              <StatsCard
                title="Average Fee Rate"
                value={`${stats.latest.avg_fee_rate} ppm`}
                change={
                  stats.previous ? stats.latest.avg_fee_rate - stats.previous.avg_fee_rate : 0
                }
                previousValue={
                  stats.previous ? stats.previous.avg_fee_rate : stats.latest.avg_fee_rate
                }
                icon={<Zap className="h-4 w-4 text-orange-500" />}
              />
              <StatsCard
                title="Median Base Fee"
                value={`${stats.latest.med_base_fee_mtokens} msat`}
                change={
                  stats.previous
                    ? stats.latest.med_base_fee_mtokens - stats.previous.med_base_fee_mtokens
                    : 0
                }
                previousValue={
                  stats.previous
                    ? stats.previous.med_base_fee_mtokens
                    : stats.latest.med_base_fee_mtokens
                }
                icon={<Bitcoin className="h-4 w-4 text-orange-500" />}
              />
            </div>
          </section>

          <section aria-labelledby="top-nodes">
            <Link href="/ranking">
              <h2
                id="top-nodes"
                className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500"
              >
                <Trophy className="h-5 w-5" />
                Top Nodes
              </h2>
            </Link>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>By Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topByCapacity.map((node, i) => (
                      <Link
                        key={node.publicKey}
                        href={`/node/${node.publicKey}`}
                        className="flex items-center justify-between h-[40px] hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <span className="font-medium">{node.alias}</span>
                        </div>
                        <span className="text-orange-500 tabular-nums">
                          ₿ {(node.capacity / 100_000_000).toLocaleString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>By Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topByChannels.map((node, i) => (
                      <Link
                        key={node.publicKey}
                        href={`/node/${node.publicKey}`}
                        className="flex items-center justify-between h-[40px] hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <div className="font-medium leading-none">{node.alias}</div>
                            {node.country && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {node.country.en}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-orange-500 tabular-nums">
                          {node.channels.toLocaleString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </article>
  )
}
