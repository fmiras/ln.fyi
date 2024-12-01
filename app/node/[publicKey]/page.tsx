import Link from 'next/link'
import { Globe, Radio, Signal } from 'lucide-react'
import { Metadata } from 'next/types'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ModeToggle } from '@/components/mode-toggle'
import { NodeLocationMap } from '@/components/node-location-map'
import { getLightningNode } from './actions'

interface PageProps {
  params: Promise<{
    publicKey: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const publicKey = (await params).publicKey
  const node = await getLightningNode(publicKey)

  return {
    title: `${node.alias} - Lightning Network Node Details - ln.fyi`,
    description: `View detailed statistics and information about Lightning Network node ${
      node.alias
    }. Capacity: ₿${(node.capacity / 100_000_000).toLocaleString()}, Active channels: ${
      node.active_channel_count
    }`,
    openGraph: {
      title: `${node.alias} - Lightning Network Node Details`,
      description: `View detailed statistics and information about Lightning Network node ${node.alias}`,
      type: 'website'
    }
  }
}

export default async function NodePage({ params }: PageProps) {
  const publicKey = (await params).publicKey
  const node = await getLightningNode(publicKey)

  const channelUtilization = (node.active_channel_count / node.opened_channel_count) * 100

  return (
    <article className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-6">
        <nav className="flex items-center justify-between pt-6" aria-label="Breadcrumb">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <Link href="/ranking" className="text-sm text-muted-foreground hover:text-foreground">
              ranking
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <Link
              href={`/node/${publicKey}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              node
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </nav>

        <section className="flex gap-6" aria-label="Node Overview">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-orange-500" />
                  <CardTitle>{node.alias}</CardTitle>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">{node.public_key}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>
                      {node.country?.en || 'Unknown'} {node.city?.en && `· ${node.city.en}`}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Channel Utilization</div>
                    <span className="text-sm">{channelUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={channelUtilization} className="h-2" />
                </div>

                <div className="flex justify-start gap-12">
                  <div>
                    <div className="text-sm text-muted-foreground">Capacity</div>
                    <div className="text-xl font-bold text-orange-500">
                      ₿ {(node.capacity / 100_000_000).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Channels</div>
                    <div className="text-xl font-bold text-orange-500">
                      {node.active_channel_count.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-[150px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="w-4 h-4" />
                Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="text-sm text-muted-foreground">Active</div>
                    <div className="text-2xl font-bold">{node.active_channel_count}</div>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="text-sm text-muted-foreground">Opened</div>
                    <div className="text-2xl font-bold">{node.opened_channel_count}</div>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="text-sm text-muted-foreground">Closed</div>
                    <div className="text-2xl font-bold">{node.closed_channel_count}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-6" aria-label="Node Details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-4 h-4" /> Supported Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {node.features
                  .sort((a, b) => a.bit - b.bit)
                  .map((feature) => (
                    <div
                      key={feature.bit}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          feature.is_required ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {feature.name === 'unknown' ? `Unknown (${feature.bit})` : feature.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {feature.is_required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {node.latitude && node.longitude ? (
                <div className="space-y-4">
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <NodeLocationMap lat={node.latitude} lng={node.longitude} />
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No location data available
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </article>
  )
}
