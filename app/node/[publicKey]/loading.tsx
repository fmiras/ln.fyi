import { Globe, Radio, Signal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ModeToggle } from '@/components/mode-toggle'

export default function Loading() {
  return (
    <article className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-6">
        <nav className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">ranking</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">node</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </nav>

        <section className="flex flex-col md:flex-row gap-6">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-orange-500" />
                  <Skeleton className="h-6 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-[300px] mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Channel Utilization</div>
                    <Skeleton className="h-4 w-[40px]" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>

                <div className="flex justify-start gap-12">
                  <div>
                    <div className="text-sm text-muted-foreground">Capacity</div>
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Channels</div>
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:max-w-[150px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="w-4 h-4" />
                Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  {['Active', 'Opened', 'Closed'].map((label) => (
                    <div key={label} className="space-y-2 flex flex-col items-center">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <Skeleton className="h-8 w-[60px]" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-4 h-4" /> Supported Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-[200px]" />
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
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </section>
      </main>
    </article>
  )
}
