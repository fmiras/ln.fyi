import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Bitcoin, Network, ExternalLink } from 'lucide-react'

import { getChannelRanking, getLiquidityRanking } from './actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Top 100 Lightning Nodes — Rankings',
  description:
    'Live ranking of the top 100 Lightning Network nodes by capacity and by channel count. See who runs the network and where they&rsquo;re based.',
  alternates: {
    canonical: 'https://ln.fyi/ranking'
  },
  openGraph: {
    title: 'Top 100 Lightning Nodes — ln.fyi',
    description:
      'Live ranking of the top 100 Lightning Network nodes by capacity and by channel count.',
    type: 'website'
  }
}

export default async function RankingPage() {
  const [topByCapacity, topByChannels] = await Promise.all([
    getLiquidityRanking(),
    getChannelRanking()
  ])

  return (
    <main className="flex flex-col gap-10 pb-12">
      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-orange-500">
            <Trophy className="h-3.5 w-3.5" />
            Live Rankings
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance leading-[1.05]">
            Top 100 Lightning Nodes
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            The biggest and most connected nodes on the network right now. Click any
            row to dive into a node&rsquo;s full profile.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <RankList
            title="By Capacity"
            subtitle="Total BTC locked in channels"
            icon={<Bitcoin className="h-4 w-4" />}
            nodes={topByCapacity}
            metric={(node) => ({
              raw: node.capacity,
              formatted: `₿ ${(node.capacity / 100_000_000).toLocaleString()}`
            })}
          />
          <RankList
            title="By Channels"
            subtitle="Most peer connections"
            icon={<Network className="h-4 w-4" />}
            nodes={topByChannels}
            metric={(node) => ({
              raw: node.channels,
              formatted: node.channels.toLocaleString()
            })}
          />
        </div>
      </section>
    </main>
  )
}

type NodeItem = {
  publicKey: string
  alias: string
  channels: number
  capacity: number
  city: { en: string } | null
  country: { en: string } | null
  iso_code: string | null
}

function RankList({
  title,
  subtitle,
  icon,
  nodes,
  metric
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  nodes: NodeItem[]
  metric: (node: NodeItem) => { raw: number; formatted: string }
}) {
  const maxVal = Math.max(...nodes.map((n) => metric(n).raw), 1)
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-border/60">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ol className="divide-y divide-border/60">
        {nodes.map((node, i) => {
          const { raw, formatted } = metric(node)
          const pct = (raw / maxVal) * 100
          return (
            <li key={node.publicKey}>
              <Link
                href={`/node/${node.publicKey}`}
                className="relative flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors group"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right tabular-nums shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {node.alias}
                      <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {(node.country || node.city) && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {node.iso_code && (
                          <span className="font-mono mr-1.5">
                            {String.fromCodePoint(
                              ...node.iso_code
                                .toUpperCase()
                                .split('')
                                .map((c) => 127397 + c.charCodeAt(0))
                            )}
                          </span>
                        )}
                        {node.country?.en || 'Unknown'}
                        {node.city?.en ? ` · ${node.city.en}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <span className="relative text-sm font-mono text-foreground tabular-nums shrink-0">
                  {formatted}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
