import Link from 'next/link'
import {
  Bitcoin,
  Zap,
  Network,
  Users,
  Trophy,
  ArrowRight,
  Globe2,
  Server,
  TrendingUp,
  Sparkles
} from 'lucide-react'

import { IntervalToggle } from '@/components/interval-toggle'
import { LivePulse } from '@/components/live-pulse'
import { NodeTypeDonut } from '@/components/node-type-donut'
import { DistributionBars } from '@/components/distribution-bars'
import {
  getNodesRanking,
  getStats,
  getStatsVariations,
  getNodesPerCountry,
  getNodesPerISP,
  StatsVariation
} from './actions'
import { NetworkChart } from './network-chart'
import { Interval, INTERVALS } from '../lib/types'
import { StatsCard } from './stats-card'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ interval?: string; error?: string }>
}) {
  const search = await searchParams
  const interval: Interval = search.interval
    ? INTERVALS.includes(search.interval as Interval)
      ? (search.interval as Interval)
      : '3m'
    : '3m'

  const [stats, historicalStats, nodesRanking, countries, isps] = await Promise.all([
    getStats(),
    getStatsVariations(interval),
    getNodesRanking(),
    getNodesPerCountry(),
    getNodesPerISP()
  ])

  const previous: StatsVariation | null = historicalStats.reduce(
    (acc, curr) => (acc && acc.added < curr.added ? acc : curr),
    historicalStats[0] || null
  )

  const { topByCapacity, topByChannels } = nodesRanking
  const latest = stats.latest

  const capacityBtc = latest.total_capacity / 100_000_000

  const donutData = [
    {
      label: 'Clearnet',
      value: latest.clearnet_nodes,
      color: 'hsl(var(--chart-1))',
      tooltip: 'Nodes accessible over public IPs.'
    },
    {
      label: 'Tor',
      value: latest.tor_nodes,
      color: 'hsl(var(--chart-3))',
      tooltip: 'Nodes reachable only through the Tor network.'
    },
    {
      label: 'Hybrid',
      value: latest.clearnet_tor_nodes,
      color: 'hsl(var(--chart-2))',
      tooltip: 'Nodes reachable over both Tor and the clearnet.'
    },
    {
      label: 'Unannounced',
      value: latest.unannounced_nodes,
      color: 'hsl(var(--chart-4))',
      tooltip: 'Private nodes that do not announce themselves.'
    }
  ]

  const diff = (key: keyof StatsVariation) => {
    if (!previous) return 0
    const latestVal = latest[key as keyof typeof latest] as number
    const prevVal = previous[key] as number
    return Number(latestVal) - Number(prevVal)
  }

  const prevVal = (key: keyof StatsVariation) => {
    if (!previous) return (latest[key as keyof typeof latest] as number) || 1
    return (previous[key] as number) || 1
  }

  return (
    <main className="flex flex-col gap-12 sm:gap-16 pb-12">
      {/* Hero */}
      <section
        className="relative container mx-auto px-4 sm:px-6 pt-8 sm:pt-12"
        aria-labelledby="hero-heading"
      >
        <div className="flex flex-col items-start gap-4 sm:gap-5 max-w-3xl">
          <LivePulse label="Live network data" />
          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.05]"
          >
            The Lightning Network,{' '}
            <span className="text-gradient">live & unfiltered.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty max-w-2xl">
            Real-time stats, top node rankings, capacity flows, and everything you need
            to understand Bitcoin&rsquo;s Layer 2. Fresh from mempool.space & amboss.space.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Link
              href="/ranking"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-orange-500 px-5 text-sm font-medium text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
            >
              Top 100 Nodes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/learn"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background/60 px-5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Learn Lightning <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <section
        aria-labelledby="network-stats"
        className="container mx-auto px-4 sm:px-6 flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2
              id="network-stats"
              className="text-xl sm:text-2xl font-semibold tracking-tight"
            >
              Network Overview
            </h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              vs. {interval} ago
            </span>
          </div>
          <IntervalToggle currentInterval={interval} />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Nodes"
            value={latest.node_count.toLocaleString()}
            change={diff('node_count')}
            previousValue={prevVal('node_count')}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Total Channels"
            value={latest.channel_count.toLocaleString()}
            change={diff('channel_count')}
            previousValue={prevVal('channel_count')}
            icon={<Network className="h-4 w-4" />}
          />
          <StatsCard
            title="Total Capacity"
            value={`₿ ${capacityBtc.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            hoverValue={`${((capacityBtc / 21_000_000) * 100).toFixed(4)}% supply`}
            subtitle={`≈ ${(latest.total_capacity / 100_000).toLocaleString()} sats`}
            change={diff('total_capacity')}
            previousValue={prevVal('total_capacity')}
            format="btc"
            icon={<Bitcoin className="h-4 w-4" />}
          />
          <StatsCard
            title="Avg Channel"
            value={`${(latest.avg_capacity / 100_000).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })} sats`}
            change={
              stats.previous ? latest.avg_capacity - stats.previous.avg_capacity : 0
            }
            previousValue={stats.previous?.avg_capacity || latest.avg_capacity}
            icon={<TrendingUp className="h-4 w-4" />}
            tooltip="Average capacity per Lightning channel across the whole network."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Capacity Growth</h3>
                <p className="text-xs text-muted-foreground">
                  Total locked in Lightning channels over time
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">
                  ₿ {capacityBtc.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  now
                </div>
              </div>
            </div>
            <div className="h-[200px] sm:h-[240px] -mx-2">
              <NetworkChart data={historicalStats} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 flex flex-col">
            <div className="mb-4">
              <h3 className="font-semibold">Node Distribution</h3>
              <p className="text-xs text-muted-foreground">By connectivity type</p>
            </div>
            <NodeTypeDonut data={donutData} />
          </div>
        </div>
      </section>

      {/* Channel stats strip */}
      <section
        aria-labelledby="channel-stats"
        className="container mx-auto px-4 sm:px-6 flex flex-col gap-5"
      >
        <h2
          id="channel-stats"
          className="text-xl sm:text-2xl font-semibold tracking-tight"
        >
          Channel Economics
        </h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Avg Fee Rate"
            value={`${latest.avg_fee_rate} ppm`}
            change={stats.previous ? latest.avg_fee_rate - stats.previous.avg_fee_rate : 0}
            previousValue={stats.previous?.avg_fee_rate || latest.avg_fee_rate}
            icon={<Zap className="h-4 w-4" />}
            tooltip="Average proportional routing fee expressed in parts per million (1000 ppm = 0.1%)."
          />
          <StatsCard
            title="Median Base Fee"
            value={`${latest.med_base_fee_mtokens} msat`}
            change={
              stats.previous
                ? latest.med_base_fee_mtokens - stats.previous.med_base_fee_mtokens
                : 0
            }
            previousValue={
              stats.previous?.med_base_fee_mtokens || latest.med_base_fee_mtokens
            }
            icon={<Bitcoin className="h-4 w-4" />}
            tooltip="Fixed fee charged per routed payment, in millisatoshis (1/1000 of a sat)."
          />
          <StatsCard
            title="Median Capacity"
            value={`${(latest.med_capacity / 100_000).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })} sats`}
            change={stats.previous ? latest.med_capacity - stats.previous.med_capacity : 0}
            previousValue={stats.previous?.med_capacity || latest.med_capacity}
            icon={<Bitcoin className="h-4 w-4" />}
            tooltip="Median channel capacity across the network."
          />
          <StatsCard
            title="Median Fee Rate"
            value={`${latest.med_fee_rate} ppm`}
            change={stats.previous ? latest.med_fee_rate - stats.previous.med_fee_rate : 0}
            previousValue={stats.previous?.med_fee_rate || latest.med_fee_rate}
            icon={<Zap className="h-4 w-4" />}
            tooltip="Median fee rate — less influenced by outliers than the average."
          />
        </div>
      </section>

      {/* Geographic & ISP breakdown */}
      {(countries.length > 0 || isps.length > 0) && (
        <section
          aria-labelledby="geo-stats"
          className="container mx-auto px-4 sm:px-6 flex flex-col gap-5"
        >
          <div>
            <h2
              id="geo-stats"
              className="text-xl sm:text-2xl font-semibold tracking-tight"
            >
              Where the Lightning lives
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Node distribution across the world and their hosting infrastructure.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {countries.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Top Countries</h3>
                    <p className="text-xs text-muted-foreground">
                      By node count
                    </p>
                  </div>
                </div>
                <DistributionBars
                  colorIndex={0}
                  items={countries.slice(0, 10).map((c) => ({
                    label: c.name.en,
                    value: c.count,
                    hint: `${(c.capacity / 100_000_000).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })} BTC`
                  }))}
                />
              </div>
            )}

            {isps.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Top Hosting Providers</h3>
                    <p className="text-xs text-muted-foreground">
                      By capacity held
                    </p>
                  </div>
                </div>
                <DistributionBars
                  colorIndex={2}
                  items={isps.slice(0, 10).map((isp) => ({
                    label: isp.name,
                    value: Math.round(isp.capacity / 100_000_000),
                    hint: `${isp.count} nodes`
                  }))}
                  formatValue={(v) => `${v.toLocaleString()} BTC`}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Top nodes */}
      <section
        aria-labelledby="top-nodes"
        className="container mx-auto px-4 sm:px-6 flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="top-nodes"
              className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2"
            >
              <Trophy className="h-5 w-5 text-orange-500" />
              Top Nodes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              The biggest players currently routing payments on Lightning.
            </p>
          </div>
          <Link
            href="/ranking"
            className="text-sm text-orange-500 hover:text-orange-600 inline-flex items-center gap-1"
          >
            Full rankings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div>
                <h3 className="font-semibold">By Capacity</h3>
                <p className="text-xs text-muted-foreground">Total BTC locked</p>
              </div>
            </div>
            <ol className="divide-y divide-border/60">
              {topByCapacity.slice(0, 10).map((node, i) => (
                <li key={node.publicKey}>
                  <Link
                    href={`/node/${node.publicKey}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-5 text-right tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium truncate">{node.alias}</span>
                    </div>
                    <span className="text-sm font-mono text-foreground tabular-nums shrink-0 ml-2">
                      ₿ {(node.capacity / 100_000_000).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div>
                <h3 className="font-semibold">By Channels</h3>
                <p className="text-xs text-muted-foreground">Most connected</p>
              </div>
            </div>
            <ol className="divide-y divide-border/60">
              {topByChannels.slice(0, 10).map((node, i) => (
                <li key={node.publicKey}>
                  <Link
                    href={`/node/${node.publicKey}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-5 text-right tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{node.alias}</div>
                        {node.country && (
                          <div className="text-xs text-muted-foreground truncate">
                            {node.country.en}
                            {node.city ? ` · ${node.city.en}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-mono text-foreground tabular-nums shrink-0 ml-2">
                      {node.channels.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Invoice CTA */}
      <section className="container mx-auto px-4 sm:px-6" aria-labelledby="invoice-cta">
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-orange-500 mb-2">
                <Zap className="h-3.5 w-3.5 fill-orange-500" />
                Invoice Tools
              </div>
              <h2
                id="invoice-cta"
                className="text-xl sm:text-2xl font-semibold tracking-tight"
              >
                Decode any BOLT11 Lightning invoice
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Inspect amounts, expiry, routing hints, and the payee&rsquo;s node — all
                from an <code className="font-mono text-xs bg-background/80 px-1 py-0.5 rounded">lnbc…</code> string.
              </p>
            </div>
            <form action="/invoice" className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                name="raw_invoice"
                pattern="^ln[a-zA-Z0-9]*$"
                required
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="lnbc1m1pn..."
                className="h-11 w-full md:w-72 rounded-lg border border-border bg-background/80 px-4 text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/40"
              />
              <button
                type="submit"
                className="h-11 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 transition-colors shrink-0"
              >
                Decode <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
