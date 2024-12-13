import { ImageResponse } from 'next/og'
import { decode } from '@/lib/decode'

export const runtime = 'edge'
export const alt = 'ln.fyi - Lightning Invoice Details'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatAmount(sats: number): string {
  const btc = sats / 100_000_000
  return `${(sats / 1000).toLocaleString()} sats (${btc} BTC)`
}

export default async function Image({ params }: { params: { invoice: string } }) {
  const decoded = decode(params.invoice)
  const amount = decoded.amount || 0
  const description = decoded.description || 'No description'

  const geistSemiBold = await fetch(
    new URL('../../public/Geist-SemiBold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          background: '#fa7014',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2%, transparent 2.5%)',
          backgroundSize: '50px 50px'
        }}
      >
        {/* Receipt Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '90%',
            height: '90%',
            padding: '40px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid #eee'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
              borderBottom: '2px dashed #eee',
              paddingBottom: '20px'
            }}
          >
            <div style={{ fontSize: '64px', fontWeight: '600' }}>ln.fyi</div>
            <div
              style={{
                fontSize: '24px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Lightning Invoice
            </div>
          </div>

          {/* Amount Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '40px',
              padding: '20px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}
          >
            <div style={{ fontSize: '24px', color: '#666' }}>Amount Due</div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              ⚡️ {formatAmount(amount)}
            </div>
          </div>

          {/* Description Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderTop: '2px dashed #eee',
              paddingTop: '20px'
            }}
          >
            <div style={{ fontSize: '24px', color: '#666' }}>Description</div>
            <div
              style={{
                fontSize: '32px',
                color: '#333',
                wordWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              {description}
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
