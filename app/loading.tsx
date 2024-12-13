import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <article className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col w-full items-center">
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <main className="container relative p-4 sm:p-8 flex flex-col gap-8">
        {/* Nav */}
        <nav className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">ln.fyi</h1>
          </div>
          <Skeleton className="h-10 w-10" />
        </nav>

        {/* Info Box */}
        <Skeleton className="w-full h-[120px] rounded-lg" />

        {/* Network Stats Section */}
        <div className="space-y-6">
          <section className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-500">
                Network Statistics
              </h2>
              <Skeleton className="h-9 w-[200px]" />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Skeleton className="h-4 w-[100px]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-[120px] mb-2" />
                    <Skeleton className="h-4 w-[80px]" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Distribution and Chart Cards */}
            <div className="grid gap-4 md:grid-cols-3 w-full">
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle>Node Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-[80px] rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 md:col-span-2">
                <CardHeader>
                  <CardTitle>Network Channels</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <Skeleton className="w-full h-full" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Info Boxes and Other Sections */}
          <Skeleton className="w-full h-[120px] rounded-lg" />

          {/* Top Nodes Section */}
          <section>
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="border-orange-500/20">
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-[120px]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="flex items-center justify-between h-[40px]">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                          <Skeleton className="h-4 w-[80px]" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </article>
  )
}
