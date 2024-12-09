import { Trophy } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-8">
        <nav className="flex items-center justify-between pt-6">
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
        </nav>

        <article className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500">
              <Trophy className="h-5 w-5" />
              Top 100 Lightning Network Nodes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Capacity Card */}
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>By Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <Skeleton className="h-4 w-[200px] mb-2" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Channels Card */}
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>By Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <Skeleton className="h-4 w-[200px] mb-2" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </article>
      </main>
    </div>
  )
}
