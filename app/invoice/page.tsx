import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, XCircle } from 'lucide-react'

import LightningInvoice from '@/components/lightning-invoice'
import { decode } from '@/lib/decode'

interface PageProps {
  searchParams: Promise<{
    raw_invoice?: string
    error?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawInvoice = (await searchParams).raw_invoice
  if (!rawInvoice) {
    return {
      title: 'Decode Lightning Invoice',
      description:
        'Paste any BOLT11 Lightning invoice to decode amount, payee, description, expiry and routing hints. Free, client-side, private.',
      alternates: { canonical: 'https://ln.fyi/invoice' }
    }
  }
  const invoice = decode(rawInvoice)
  const prefix = invoice.description ? `${invoice.description} — ` : ''
  return {
    title: `${prefix}Lightning Invoice`,
    description: `Lightning invoice${
      invoice.description ? ` for "${invoice.description}"` : ''
    }${invoice.amount ? ` — ${invoice.amount.toLocaleString()} sats` : ''}.`
  }
}

export default async function InvoicePage({ searchParams }: PageProps) {
  const search = await searchParams
  const rawInvoice = search.raw_invoice

  if (!rawInvoice) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-10 max-w-3xl">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-orange-500">
            <Zap className="h-3.5 w-3.5" />
            Invoice Decoder
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance leading-[1.05]">
            Decode any Lightning invoice.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Paste a BOLT11 string and see its amount, description, payee, expiry and
            signature — all in your browser, nothing phones home.
          </p>
        </div>

        <form action="/invoice" className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="raw_invoice"
            pattern="^ln[a-zA-Z0-9]*$"
            required
            autoFocus
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="lnbc1m1pn4khtz..."
            className="flex-1 h-12 rounded-lg border border-border bg-background/80 px-4 text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/40"
          />
          <button
            type="submit"
            className="h-12 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Decode <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {search.error === 'invalid_invoice' && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Invalid Lightning invoice. Please check the format and try again.
          </p>
        )}

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">What&rsquo;s a BOLT11 invoice? </span>
            It&rsquo;s a Lightning payment request — a compact string starting with{' '}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">lnbc</code>{' '}
            (on mainnet) that encodes everything needed to pay it.
          </p>
          <Link
            href="/learn#invoices"
            className="text-orange-500 hover:underline inline-flex items-center gap-1"
          >
            Read the primer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    )
  }

  const invoice = decode(rawInvoice)

  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center gap-8">
      <LightningInvoice invoice={invoice} />
      <Link
        href="/invoice"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        Decode another
      </Link>
    </main>
  )
}
