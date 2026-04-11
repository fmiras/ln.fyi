import type { Metadata } from 'next'
import Link from 'next/link'

import LightningInvoice from '@/components/lightning-invoice'
import { decode } from '@/lib/decode'

interface PageProps {
  params: Promise<{
    raw_invoice: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawInvoice = (await params).raw_invoice
  const invoice = decode(rawInvoice)

  const prefix = invoice.description ? `${invoice.description} — ` : ''

  return {
    title: `${prefix}Lightning Invoice`,
    description: `Lightning Network invoice${
      invoice.description ? ` for "${invoice.description}"` : ''
    }${invoice.amount ? ` — ${invoice.amount.toLocaleString()} sats` : ''}.`,
    openGraph: {
      title: `${invoice.description || 'Lightning Invoice'} — ln.fyi`,
      description: `Lightning Network invoice${
        invoice.description ? ` for "${invoice.description}"` : ''
      }.`,
      type: 'website'
    }
  }
}

export default async function InvoicePage({ params }: PageProps) {
  const rawInvoice = (await params).raw_invoice
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
