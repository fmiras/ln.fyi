import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getStats } from './actions'

export const alt = 'ln.fyi — Lightning Network Stats'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

export default async function Image() {
  let nodeCount = 0
  let channelCount = 0
  let totalCapacity = 0
  try {
    const stats = await getStats()
    nodeCount = stats.latest.node_count
    channelCount = stats.latest.channel_count
    totalCapacity = stats.latest.total_capacity
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
            'radial-gradient(ellipse at top right, rgba(251,146,60,0.25), transparent 55%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#fb923c,#ea580c)',
              display: 'flex'
            }}
          />
          <div style={{ fontSize: 48, fontWeight: 600 }}>ln.fyi</div>
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 600,
            lineHeight: 1.02,
            marginTop: 48,
            maxWidth: 1000,
            display: 'flex',
            flexWrap: 'wrap'
          }}
        >
          The Lightning Network, live.
        </div>

        <div
          style={{
            display: 'flex',
            gap: 60,
            marginTop: 'auto',
            alignItems: 'flex-end'
          }}
        >
          <Stat label="Nodes" value={formatNumber(nodeCount)} />
          <Stat label="Channels" value={formatNumber(channelCount)} />
          <Stat
            label="Capacity"
            value={`${(totalCapacity / 100_000_000).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })} BTC`}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Geist', data: fontData, style: 'normal', weight: 600 }]
    }
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          color: '#a8a29e',
          fontSize: 24,
          textTransform: 'uppercase',
          letterSpacing: 2
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 64, fontWeight: 600, color: '#fb923c' }}>{value}</div>
    </div>
  )
}
