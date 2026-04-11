import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { decode } from '@/lib/decode'

export const alt = 'ln.fyi — Lightning Invoice'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatSats(sats: number): string {
  if (!sats) return '0 sats'
  if (sats >= 100_000_000) return `${(sats / 100_000_000).toFixed(4)} BTC`
  return `${sats.toLocaleString()} sats`
}

export default async function Image({
  params
}: {
  params: Promise<{ raw_invoice: string }>
}) {
  const { raw_invoice } = await params
  let amount = 0
  let description = 'Lightning Invoice'
  try {
    const decoded = decode(raw_invoice)
    amount = decoded.amount || 0
    description = decoded.description || 'Lightning Invoice'
  } catch {}

  const fontPath = path.join(process.cwd(), 'public', 'Geist-SemiBold.ttf')
  const fontData = await readFile(fontPath)

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0b09',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#fb923c,#ea580c)',
              display: 'flex'
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 600 }}>ln.fyi</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: 16
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#fb923c',
              textTransform: 'uppercase',
              letterSpacing: 2
            }}
          >
            Lightning Invoice
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1,
              maxWidth: 1000
            }}
          >
            {formatSats(amount)}
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#a8a29e',
              maxWidth: 1000,
              display: 'flex'
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist', data: fontData, style: 'normal', weight: 600 }
      ]
    }
  )
}
