import Link from 'next/link'
import { Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { getChannelRanking, getLiquidityRanking } from './actions'

export default async function Home() {
  const topByCapacity = await getLiquidityRanking()
  const topByChannels = await getChannelRanking()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-8">
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <Link href="/ranking" className="text-sm text-muted-foreground hover:text-foreground">
              ranking
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500">
              <Trophy className="h-5 w-5" />
              Top Nodes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>By Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topByCapacity.map((node, i) => (
                      <div key={node.publicKey} className="flex items-center justify-between">
                        <a
                          href={`/node/${node.publicKey}`}
                          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <div className="font-medium leading-none">{node.alias}</div>
                            <div className="text-sm text-muted-foreground mt-1 space-x-1">
                              <span>{node.country?.en || 'Location unknown'}</span>
                              {node.country && node.city && (
                                <>
                                  <span>·</span>
                                  <span>{node.city.en}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </a>
                        <div className="text-right">
                          <div className="text-orange-500 tabular-nums">
                            ₿ {(node.capacity / 100_000_000).toLocaleString()}
                          </div>
                        </div>
                      </div>
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
                      <div key={node.publicKey} className="flex items-center justify-between">
                        <a
                          href={`/node/${node.publicKey}`}
                          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <div className="font-medium leading-none">{node.alias}</div>
                            <div className="text-sm text-muted-foreground mt-1 space-x-1">
                              <span>{node.country?.en || 'Location unknown'}</span>
                              {node.country && node.city && (
                                <>
                                  <span>·</span>
                                  <span>{node.city.en}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </a>
                        <div className="text-right">
                          <div className="text-orange-500 tabular-nums">
                            {node.channels.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
