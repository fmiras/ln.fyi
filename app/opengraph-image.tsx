import { ImageResponse } from 'next/og'
import { Zap, Bitcoin, Network } from 'lucide-react'
import { getStats } from './actions'

export const runtime = 'edge'

export const alt = 'ln.fyi - Lightning Network Stats'

export const size = {
  width: 1200,
  height: 630
}

export const contentType = 'image/png'

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default async function Image() {
  const stats = await getStats()
  const geistSemiBold = await fetch(new URL('../public/Geist-SemiBold.ttf', import.meta.url)).then(
    (res) => res.arrayBuffer()
  )

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            fontSize: '64px',
            fontWeight: '600',
            color: '#f97316'
          }}
        >
          ln.fyi
        </div>

        <div
          style={{
            display: 'flex',
            gap: '60px',
            alignItems: 'center',
            alignSelf: 'flex-end'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '600' }}>
              <Zap className="h-8 w-8 text-orange-500" /> {formatNumber(stats.latest.node_count)}
            </div>
            <div style={{ color: '#666', fontSize: '24px' }}>Nodes</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '600' }}>
              <Bitcoin className="h-8 w-8 text-orange-500" /> {stats.latest.total_capacity}
            </div>
            <div style={{ color: '#666', fontSize: '24px' }}>Capacity</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '600' }}>
              <Network className="h-8 w-8 text-orange-500" />{' '}
              {formatNumber(stats.latest.channel_count)}
            </div>
            <div style={{ color: '#666', fontSize: '24px' }}>Channels</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Geist',
          data: geistSemiBold,
          style: 'normal',
          weight: 600
        }
      ]
    }
  )
}
