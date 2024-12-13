import { Metadata } from 'next'

import LightningInvoice from '@/components/lightning-invoice'
import { decode } from '@/lib/decode'

interface PageProps {
  params: Promise<{
    invoice: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const invoiceHash = (await params).invoice
  const invoice = decode(invoiceHash)

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
  const invoiceHash = (await params).invoice
  const invoice = decode(invoiceHash)

  return <LightningInvoice invoice={invoice} />
}
