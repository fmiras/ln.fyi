import { Metadata } from 'next'

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

export default async function InvoicePage({ params }: PageProps) {
  const rawInvoice = (await params).raw_invoice
  const invoice = decode(rawInvoice)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-8 md:p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <LightningInvoice invoice={invoice} />
      </div>
    </div>
  )
}
