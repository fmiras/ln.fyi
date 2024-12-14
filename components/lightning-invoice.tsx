'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { formatDistance } from 'date-fns'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Invoice } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

const paperTexture = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
}

export default function LightningInvoice({
  invoice: { amount, payee, description, rawInvoice, expires, signature }
}: {
  invoice: Invoice
}) {
  const [showBtc, setShowBtc] = useState(false)
  const [simpleMode, setSimpleMode] = useState(true)
  const amountSats = amount ?? 0 / 1000
  const amountBtc = amountSats / 100000000
  const { toast } = useToast()

  const truncateAddress = (address: string) => {
    if (simpleMode) return `${address.slice(0, 6)}...${address.slice(-6)}`
    return address
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      description: 'Invoice copied to clipboard',
      duration: 2000
    })
  }

  const expiresDate = expires ? new Date(expires) : new Date()

  const isExpired = (expiresDate: Date) => {
    return new Date() > expiresDate
  }

  return (
    <div>
      <Card
        className="w-full max-w-[448px] min-w-[388px] bg-white shadow-lg rounded-lg overflow-hidden"
        style={paperTexture}
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Lightning Invoice</h1>
            <div className="flex items-center space-x-2">
              <span className={` text-sm text-black`}>Simple Mode</span>
              <Switch
                checked={simpleMode}
                onCheckedChange={setSimpleMode}
                className="transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-lg shadow-inner">
              <QRCodeSVG value={rawInvoice} size={180} />
            </div>
          </div>

          <div
            className="bg-gray-50 p-4 rounded-lg shadow-inner cursor-pointer hover:scale-102 transition-transform"
            onMouseEnter={() => setShowBtc(true)}
            onMouseLeave={() => setShowBtc(false)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-medium text-gray-700">Amount Due</h2>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {showBtc ? `${amountBtc.toFixed(8)} BTC` : `${amountSats.toLocaleString()} sats`}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {payee && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payee</p>
                  <p className="text-sm text-gray-700 break-all">{truncateAddress(payee)}</p>
                </div>
                {simpleMode && (
                  <p
                    className={`text-sm font-medium ${
                      isExpired(expiresDate) ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isExpired(expiresDate)
                      ? `Expired ${formatDistance(expiresDate, new Date(), {
                          addSuffix: true
                        })}`
                      : `Valid for ${formatDistance(expiresDate, new Date())}`}
                  </p>
                )}
              </div>
            )}

            {!simpleMode && signature && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Signature</p>
                  <p className="text-sm text-gray-700 font-mono break-all">
                    {truncateAddress(signature)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => copyToClipboard(signature)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {description && (
              <div>
                <p className="text-sm font-medium text-gray-500">{!simpleMode && 'Description'}</p>
                <p className="text-sm text-gray-700">{description}</p>
              </div>
            )}

            {!simpleMode && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Expires</p>
                  <p
                    className={`text-sm font-medium ${
                      isExpired(expiresDate) ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isExpired(expiresDate)
                      ? `Expired ${formatDistance(expiresDate, new Date())} ago`
                      : `Valid for ${formatDistance(expiresDate, new Date())}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              onClick={() => copyToClipboard(rawInvoice)}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Invoice
            </Button>
          </div>

          {!simpleMode && (
            <div className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Raw Invoice:</p>
              {rawInvoice}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
