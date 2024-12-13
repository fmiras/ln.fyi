'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Invoice } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

const paperTexture = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='0.05' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
}

export default function LightningInvoice({
  invoice: { amount, payee, description, paymentHash, expires }
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

  const containerVariants = {
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    },
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 flex items-center justify-center">
      <motion.div
        layout
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="w-[448px] bg-white shadow-lg rounded-lg overflow-hidden"
          style={paperTexture}
        >
          <motion.div
            layout
            className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200"
          >
            <div className="flex justify-between items-center">
              <motion.h1 className="text-2xl font-bold text-gray-800" layout>
                Lightning Invoice
              </motion.h1>
              <motion.div className="flex items-center space-x-2" layout>
                <motion.span animate={{ opacity: simpleMode ? 1 : 0.5 }} className="text-sm">
                  Simple
                </motion.span>
                <Switch
                  checked={simpleMode}
                  onCheckedChange={setSimpleMode}
                  className="transition-transform duration-300 hover:scale-105"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div layout className="p-6 space-y-6">
            <motion.div layout className="flex justify-center">
              <motion.div layout className="bg-white p-2 rounded-lg shadow-inner">
                <QRCodeSVG value={paymentHash} size={180} />
              </motion.div>
            </motion.div>

            <motion.div
              layout
              className="bg-gray-50 p-4 rounded-lg shadow-inner cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
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
            </motion.div>

            <motion.div layout className="space-y-4">
              {payee && (
                <motion.div layout className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payee</p>
                    <p className="text-sm text-gray-700 break-all">{truncateAddress(payee)}</p>
                  </div>
                  {simpleMode && (
                    <p className="text-sm text-emerald-600 font-medium">
                      Valid for {formatDistance(expiresDate, new Date())}
                    </p>
                  )}
                </motion.div>
              )}

              {description && (
                <motion.div layout>
                  <p className="text-sm font-medium text-gray-500">
                    {!simpleMode && 'Description'}
                  </p>
                  <p className="text-sm text-gray-700">{description}</p>
                </motion.div>
              )}

              <AnimatePresence>
                {!simpleMode && (
                  <motion.div
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={containerVariants}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-500">Expires</p>
                      <p className="text-sm text-gray-700">{expiresDate.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-emerald-600 font-medium">
                      Valid for {formatDistance(expiresDate, new Date())}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div layout className="space-y-2">
              <Button
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                onClick={() => copyToClipboard(paymentHash)}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Invoice
              </Button>
            </motion.div>

            <AnimatePresence>
              {!simpleMode && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={containerVariants}
                  className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-md"
                >
                  <p className="font-medium mb-1">Raw Invoice:</p>
                  {paymentHash}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
