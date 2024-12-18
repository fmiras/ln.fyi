import { Metadata } from 'next'

import LightningInvoice from '@/components/lightning-invoice'
import { decode } from '@/lib/decode'

interface PageProps {
  searchParams: Promise<{
    raw_invoice: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawInvoice = (await searchParams).raw_invoice
  const invoice = decode(rawInvoice)

  const titlePrefix = invoice.description ? `${invoice.description} - ` : ''

  return {
    title: `${titlePrefix}Lightning Invoice - ln.fyi`,
    description: `View detailed statistics and information about Lightning Network invoice ${
      invoice.description
    }. Amount: ₿${(invoice.amount ?? 0 / 100_000_000).toLocaleString()}`,
    openGraph: {
      title: `${invoice.description} - Lightning Invoice Details`,
      description: `View detailed statistics and information about Lightning Network invoice ${invoice.description}`,
      type: 'website'
    }
  }
}

export default async function InvoicePage({ searchParams }: PageProps) {
  const rawInvoice = (await searchParams).raw_invoice
  const invoice = decode(rawInvoice)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-100)] to-[var(--gray-200)] px-4 py-8 md:p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <LightningInvoice invoice={invoice} />
      </div>
    </div>
  )
}
