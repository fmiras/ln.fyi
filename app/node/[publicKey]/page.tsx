import Link from 'next/link'
import { Clock, Globe, Radio, Signal, Info, ExternalLink } from 'lucide-react'
import { Metadata, ResolvingMetadata } from 'next/types'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ModeToggle } from '@/components/mode-toggle'
import { NodeLocationMap } from '@/components/node-location-map'
import { getLightningNode } from './actions'

interface PageProps {
  params: Promise<{
    publicKey: string
  }>
}

interface Props {
  params: Promise<{
    publicKey: string
  }>
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

        <section className="grid gap-6 md:grid-cols-4" aria-label="Node Overview">
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-orange-500" />
                  <CardTitle>{node.alias}</CardTitle>
                </div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Node Details</h4>
                        <p className="text-sm text-muted-foreground">
                          First seen on {new Date(node.first_seen * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
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

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Channel Utilization</div>
                    <span className="text-sm">{channelUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={channelUtilization} className="h-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="w-4 h-4" />
                Channel Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Active</div>
                    <div className="text-2xl font-bold">{node.active_channel_count}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Opened</div>
                    <div className="text-2xl font-bold">{node.opened_channel_count}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Closed</div>
                    <div className="text-2xl font-bold">{node.closed_channel_count}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2" aria-label="Node Details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Node Timeline & Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">First Seen</span>
                    <span className="text-sm">
                      {new Date(node.first_seen * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Update</span>
                    <span className="text-sm">
                      {new Date(node.updated_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Socket Addresses</h3>
                  <div className="p-3 rounded-lg bg-muted font-mono text-xs break-all">
                    {node.sockets}
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://mempool.space/lightning/node/${node.public_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on Mempool.space
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
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
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Network Information</h3>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">AS Organization: </span>
                        {node.as_organization || 'Unknown'}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">AS Number: </span>
                        {node.as_number || 'Unknown'}
                      </div>
                    </div>
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
