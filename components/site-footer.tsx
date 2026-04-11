import Link from 'next/link'
import { Zap } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-16 bg-background/50">
      <div className="container mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3 max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 to-orange-600">
              <Zap className="h-4 w-4 text-white fill-white" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              ln<span className="text-orange-500">.</span>fyi
            </span>
          </Link>
          <p className="text-sm text-muted-foreground text-pretty">
            Real-time Lightning Network analytics, rankings and education. Built for
            nerds, by nerds.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-foreground">Explore</div>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Network stats
            </Link>
            <Link href="/ranking" className="text-muted-foreground hover:text-foreground">
              Top 100 nodes
            </Link>
            <Link href="/invoice" className="text-muted-foreground hover:text-foreground">
              Decode invoice
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-foreground">Learn</div>
            <Link href="/learn" className="text-muted-foreground hover:text-foreground">
              Lightning 101
            </Link>
            <Link
              href="/learn#channels"
              className="text-muted-foreground hover:text-foreground"
            >
              Channels
            </Link>
            <Link
              href="/learn#invoices"
              className="text-muted-foreground hover:text-foreground"
            >
              Invoices
            </Link>
          </div>
          <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
            <div className="font-semibold text-foreground">Resources</div>
            <Link
              href="https://mempool.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              mempool.space
            </Link>
            <Link
              href="https://amboss.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              amboss.space
            </Link>
            <Link
              href="https://lightning.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              lightning.network
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 py-6 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Data sourced from{' '}
          <Link
            href="https://mempool.space"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            mempool.space
          </Link>{' '}
          &{' '}
          <Link
            href="https://amboss.space"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            amboss.space
          </Link>
          . Not financial advice.
        </p>
        <p>
          Made with{' '}
          <span className="text-orange-500" aria-label="lightning">
            ⚡
          </span>{' '}
          by{' '}
          <Link
            href="https://twitter.com/fefomiras"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            @fefomiras
          </Link>
        </p>
      </div>
    </footer>
  )
}
