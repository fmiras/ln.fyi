import LightningInvoice from '@/components/lightning-invoice'
import { Invoice } from '@/lib/types'

export function decode(_invoice: string): Invoice {
  return {
    amount: 100000,
    payee: '035dd73e7f53dd0b3e9a94910d73ab52d33f2dd92c7321cfabef1dd05e2a6e7445',
    invoice:
      'lnbc1m1pn4khtzpp5ucrhq2pq5avz8ptvxvwexnw27rg50rxyvqtg0elp4q4j28jjdzzsdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhd7tlprcnknpedcqqqqryqqqqthqqpysp5wl4w9ytv7avlfy98gf3y3mlc8cargzgh9x8vrr78lc8jyf365mcq9qrsgqwcew4ss2nv6wfud93z2tn04kpfvcg7mjn7evydk5te7hywgnyqcsl2sdfty5340emcl9zul95cw3th754dpry556rnfjkuyn4ra5wnsq75v7zu',
    paymentHash: 'e607702820a75823856c331d934dcaf0d1478cc4601687e7e1a82b251e526885',
    description: 'Payment for services',
    expires: 1734085562183
  }
}

export default async function InvoicePage({ params }: { params: Promise<{ invoice: string }> }) {
  const invoiceHash = (await params).invoice
  const invoice = decode(invoiceHash)

  return <LightningInvoice invoice={invoice} />
}
