import { Invoice } from './types'
import { decode as decodeBolt11 } from 'bolt11'

export function decode(invoice: string): Invoice {
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
}
