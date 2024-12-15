import { decode as decodeBolt11 } from 'bolt11'
import { redirect } from 'next/navigation'

import { Invoice } from './types'

export function decode(invoice: string): Invoice {
  try {
    const decoded = decodeBolt11(invoice)

    return {
      amount: decoded.satoshis,
      payee: decoded.payeeNodeKey,
      rawInvoice: decoded.paymentRequest || invoice,
      signature: decoded.signature,
      description: decoded.tags.find((tag) => tag.tagName === 'description')?.data.toString(),
      expires: decoded.timeExpireDateString,
      timestamp: decoded.timestampString
    }
  } catch (error) {
    redirect('/?error=invalid_invoice')
  }
}
