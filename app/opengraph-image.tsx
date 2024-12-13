import { ImageResponse } from 'next/og'
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
          background: 'linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.95) 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          justifyContent: 'space-between'
        }}
      >
        {/* Logo and Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: '600',
              background: 'linear-gradient(45deg, #f97316, #fb923c)',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            ln.fyi
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#666',
              marginLeft: '8px'
            }}
          >
            Lightning Network Statistics
          </div>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '32px',
              background: 'rgba(249, 115, 22, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              flex: 1
            }}
          >
            <div style={{ fontSize: '24px', color: '#666', marginBottom: '8px' }}>Total Nodes</div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#f97316'
              }}
            >
              👥 {formatNumber(stats.latest.node_count)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '32px',
              background: 'rgba(249, 115, 22, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              flex: 1
            }}
          >
            <div style={{ fontSize: '24px', color: '#666', marginBottom: '8px' }}>
              Total Capacity
            </div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#f97316'
              }}
            >
              ₿ {(stats.latest.total_capacity / 100_000_000).toFixed(0)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '32px',
              background: 'rgba(249, 115, 22, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              flex: 1
            }}
          >
            <div style={{ fontSize: '24px', color: '#666', marginBottom: '8px' }}>
              Total Channels
            </div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#f97316'
              }}
            >
              🔗 {formatNumber(stats.latest.channel_count)}
            </div>
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
