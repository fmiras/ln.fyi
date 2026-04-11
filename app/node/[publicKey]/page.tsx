import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Globe,
  Radio,
  ExternalLink,
  Copy,
  Activity,
  Calendar,
  Bitcoin,
  Network as NetworkIcon,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react'

import { NodeLocationMap } from '@/components/node-location-map'
import { getLightningNode } from './actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    publicKey: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const publicKey = (await params).publicKey
  const node = await getLightningNode(publicKey)

  const title = `${node.alias} — Lightning Network Node`
  const description = `Lightning Network node ${node.alias}. Capacity ₿${(
    node.capacity / 100_000_000
  ).toLocaleString()}, ${node.active_channel_count.toLocaleString()} active channels. Location: ${
    node.country?.en || 'unknown'
  }.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://ln.fyi/node/${publicKey}`
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: `https://ln.fyi/node/${publicKey}`
    }
  }
}

export default async function NodePage({ params }: PageProps) {
  const publicKey = (await params).publicKey
  const node = await getLightningNode(publicKey)

  const channelUtilization = node.opened_channel_count
    ? (node.active_channel_count / node.opened_channel_count) * 100
    : 0

  const sockets = (node.sockets || '').split(',').filter(Boolean)
  const firstSeen = node.first_seen ? new Date(node.first_seen * 1000) : null
  const updatedAt = node.updated_at ? new Date(node.updated_at * 1000) : null

  return (
    <main className="flex flex-col gap-8 pb-12">
      <section className="container mx-auto px-4 sm:px-6 pt-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Network
          </Link>
          <span>/</span>
          <Link href="/ranking" className="hover:text-foreground">
            Rankings
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{node.alias}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              <div
                className="h-14 w-14 shrink-0 rounded-xl border border-border/60 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{
                  backgroundColor: node.color || 'hsl(var(--primary))'
                }}
                aria-hidden
              >
                {node.alias.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight truncate">
                    {node.alias}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Copy className="h-3 w-3 shrink-0" />
                  <code className="font-mono truncate" title={node.public_key}>
                    <span className="hidden sm:inline">{node.public_key}</span>
                    <span className="sm:hidden">
                      {node.public_key.slice(0, 10)}…{node.public_key.slice(-10)}
                    </span>
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`https://amboss.space/node/${node.public_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 text-xs font-medium hover:border-orange-500/40 hover:bg-muted transition-colors"
            >
              amboss.space <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`https://mempool.space/lightning/node/${node.public_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 text-xs font-medium hover:border-orange-500/40 hover:bg-muted transition-colors"
            >
              mempool.space <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`https://1ml.com/node/${node.public_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 text-xs font-medium hover:border-orange-500/40 hover:bg-muted transition-colors"
            >
              1ml.com <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            icon={<Bitcoin className="h-4 w-4" />}
            label="Capacity"
            value={`₿ ${(node.capacity / 100_000_000).toLocaleString()}`}
            subtitle={`${(node.capacity / 100_000).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })} sats`}
          />
          <MetricCard
            icon={<NetworkIcon className="h-4 w-4" />}
            label="Active Channels"
            value={node.active_channel_count.toLocaleString()}
            subtitle={`${node.opened_channel_count.toLocaleString()} ever opened`}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Utilization"
            value={`${channelUtilization.toFixed(1)}%`}
            subtitle={`${node.closed_channel_count.toLocaleString()} closed`}
            progress={channelUtilization}
          />
          <MetricCard
            icon={<Calendar className="h-4 w-4" />}
            label="First Seen"
            value={
              firstSeen
                ? firstSeen.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })
                : '—'
            }
            subtitle={
              updatedAt
                ? `Updated ${updatedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}`
                : undefined
            }
          />
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" />
              <div>
                <h2 className="font-semibold">Location</h2>
                <p className="text-xs text-muted-foreground">
                  {node.country?.en || 'Unknown'}
                  {node.city?.en ? ` · ${node.city.en}` : ''}
                  {node.as_organization ? ` · ${node.as_organization}` : ''}
                </p>
              </div>
            </div>
            {node.latitude != null && node.longitude != null ? (
              <div className="h-[320px]">
                <NodeLocationMap lat={node.latitude} lng={node.longitude} />
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No geographic data available.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold">Sockets</h2>
            </div>
            {sockets.length ? (
              <ul className="flex flex-col gap-2 text-sm">
                {sockets.slice(0, 8).map((socket) => (
                  <li
                    key={socket}
                    className="rounded-md border border-border/60 bg-background/60 px-3 py-2 font-mono text-xs truncate"
                    title={socket}
                  >
                    {socket}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No public sockets announced.</p>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold">Supported Features</h2>
          </div>
          {node.features.length ? (
            <div className="flex flex-wrap gap-2">
              {node.features
                .sort((a, b) => a.bit - b.bit)
                .map((feature) => (
                  <div
                    key={feature.bit}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        feature.is_required ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-medium">
                      {feature.name === 'unknown'
                        ? `bit ${feature.bit}`
                        : feature.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {feature.is_required ? 'required' : 'optional'}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No features advertised.</p>
          )}
        </div>
      </section>
    </main>
  )
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  progress
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  progress?: number
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          {icon}
        </div>
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums truncate">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>
      )}
      {progress != null && (
        <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
