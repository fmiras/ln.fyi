'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Zap, Clock, User, FileText, Shield, Info } from 'lucide-react'
import { formatDistance } from 'date-fns'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Invoice } from '@/lib/types'

export default function LightningInvoice({
  invoice: { amount, payee, description, rawInvoice, expires, signature }
}: {
  invoice: Invoice
}) {
  const [showBtc, setShowBtc] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const amountSats = amount ?? 0
  const amountBtc = amountSats / 100_000_000

  const truncate = (s: string) => `${s.slice(0, 10)}…${s.slice(-10)}`

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast({ description: `${label} copied to clipboard`, duration: 1800 })
  }

  const expiresDate = expires ? new Date(expires) : null
  const isExpired = expiresDate ? new Date() > expiresDate : false

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm overflow-hidden shadow-xl shadow-orange-500/5">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-6 pb-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow shadow-orange-500/30">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Lightning Invoice</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                BOLT11
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isExpired
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Clock className="h-3 w-3" />
            {expiresDate
              ? isExpired
                ? `Expired ${formatDistance(expiresDate, new Date(), { addSuffix: true })}`
                : `Valid for ${formatDistance(expiresDate, new Date())}`
              : 'Unknown'}
          </span>
        </div>

        <div className="relative p-6 flex flex-col items-center gap-4">
          <div className="p-3 rounded-xl bg-white shadow-inner">
            <QRCodeSVG value={rawInvoice} size={180} level="M" />
          </div>

          <button
            type="button"
            onClick={() => setShowBtc((v) => !v)}
            className="text-center w-full rounded-xl bg-muted/60 hover:bg-muted px-4 py-3 transition-colors"
            aria-label="Toggle BTC / sats"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Amount due
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {showBtc
                ? `₿ ${amountBtc.toFixed(8)}`
                : `${amountSats.toLocaleString()} sats`}
            </div>
          </button>
        </div>

        <div className="relative px-6 pb-4 flex flex-col gap-3">
          {description && (
            <Row icon={<FileText className="h-3.5 w-3.5" />} label="Description">
              <span className="text-sm text-foreground text-right truncate">
                {description}
              </span>
            </Row>
          )}
          {payee && (
            <Row icon={<User className="h-3.5 w-3.5" />} label="Payee">
              <code className="text-xs font-mono text-foreground">{truncate(payee)}</code>
            </Row>
          )}
          {signature && (
            <Row icon={<Shield className="h-3.5 w-3.5" />} label="Signature">
              <code className="text-xs font-mono text-foreground">{truncate(signature)}</code>
            </Row>
          )}
        </div>

        <div className="relative p-4 pt-0">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
            onClick={() => copy(rawInvoice, 'Invoice')}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy full invoice'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="relative w-full flex items-center justify-center gap-1.5 px-6 py-3 border-t border-border/60 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-3 w-3" />
          {showRaw ? 'Hide raw invoice' : 'Show raw invoice'}
        </button>
        {showRaw && (
          <div className="relative px-6 pb-6 text-[11px] text-muted-foreground break-all font-mono bg-muted/40 py-3">
            {rawInvoice}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  children
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        {icon}
        <span className="uppercase tracking-wider text-[10px]">{label}</span>
      </div>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  )
}

export { LightningInvoice }
