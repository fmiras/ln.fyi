'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { formatDistance } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Invoice } from '@/lib/types'

const paperTexture = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='0.05' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
}

export default function LightningInvoice({
  invoice: { amount, payee, invoice, paymentHash, description, expires }
}: {
  invoice: Invoice
}) {
  const [showBtc, setShowBtc] = useState(false)
  const amountSats = amount ?? 0 / 1000
  const amountBtc = amountSats / 100000000
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      description: 'Invoice copied to clipboard',
      duration: 2000
    })
  }

  const expiresDate = expires ? new Date(expires) : new Date()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 flex items-center justify-center">
      <Card
        className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
        style={paperTexture}
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Lightning Invoice</h1>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-lg shadow-inner">
              <QRCodeSVG value={invoice} size={180} />
            </div>
          </div>

          <div
            className="bg-gray-50 p-4 rounded-lg shadow-inner cursor-pointer transition-all duration-300 ease-in-out"
            onMouseEnter={() => setShowBtc(true)}
            onMouseLeave={() => setShowBtc(false)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-medium text-gray-700">Amount Due</h2>
                <p className="text-sm text-gray-500">{showBtc ? 'Bitcoin' : 'Satoshis'}</p>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {showBtc ? `₿ ${amountBtc.toFixed(8)}` : `${amountSats.toLocaleString()} sats`}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Payee</p>
              <p className="text-sm text-gray-700 break-all">{payee}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Payment Hash</p>
              <p className="text-sm text-gray-700 break-all">{paymentHash}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-sm text-gray-700">{description || 'N/A'}</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Expires</p>
                <p className="text-sm text-gray-700">{expiresDate.toLocaleString()}</p>
              </div>

              <p className="text-sm text-emerald-600 font-medium">
                Valid for {formatDistance(expiresDate, new Date())}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              onClick={() => copyToClipboard(invoice)}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Invoice
            </Button>
          </div>

          <div className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Raw Invoice:</p>
            {invoice}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
