import LightningInvoice from '@/components/lightning-invoice'
import { decode } from '@/lib/decode'

export default async function InvoicePage({ params }: { params: Promise<{ invoice: string }> }) {
  const invoiceHash = (await params).invoice
  const invoice = decode(invoiceHash)

  return <LightningInvoice invoice={invoice} />
}
