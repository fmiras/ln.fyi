import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getLightningNode } from './actions'

export const alt = 'ln.fyi — Lightning Network Node'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

export default async function Image({
  params
}: {
  params: Promise<{ publicKey: string }>
}) {
  const publicKey = (await params).publicKey
  let alias = 'Lightning Node'
  let capacity = 0
  let channels = 0
  let country = ''
  try {
    const node = await getLightningNode(publicKey)
    alias = node.alias || alias
    capacity = node.capacity || 0
    channels = node.active_channel_count || node.opened_channel_count || 0
    country = node.country?.en || ''
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
          color: 'white',
          backgroundImage:
            'radial-gradient(ellipse at top right, rgba(251,146,60,0.22), transparent 60%)'
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
            fontSize: 24,
            color: '#fb923c',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginTop: 56
          }}
        >
          Lightning Node
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 600,
            lineHeight: 1,
            marginTop: 10,
            maxWidth: 1050,
            display: 'flex'
          }}
        >
          {alias}
        </div>
        {country && (
          <div style={{ fontSize: 28, color: '#a8a29e', marginTop: 12 }}>{country}</div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 72,
            marginTop: 'auto',
            alignItems: 'flex-end'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 22,
                color: '#a8a29e',
                textTransform: 'uppercase',
                letterSpacing: 2
              }}
            >
              Capacity
            </div>
            <div style={{ fontSize: 64, fontWeight: 600, color: '#fb923c' }}>
              {(capacity / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })} BTC
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 22,
                color: '#a8a29e',
                textTransform: 'uppercase',
                letterSpacing: 2
              }}
            >
              Channels
            </div>
            <div style={{ fontSize: 64, fontWeight: 600, color: '#fb923c' }}>
              {formatNumber(channels)}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Geist', data: fontData, style: 'normal', weight: 600 }]
    }
  )
}
