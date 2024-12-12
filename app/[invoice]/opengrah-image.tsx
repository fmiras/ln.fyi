import { ImageResponse } from 'next/og'

import { decode } from '@/lib/decode'

export const runtime = 'edge'

export const alt = 'ln.fyi - Lightning Invoice Details'

export const size = {
  width: 1200,
  height: 630
}

export const contentType = 'image/png'

// Helper to format satoshis to BTC
function formatAmount(sats: number): string {
  return (sats / 100_000_000).toFixed(8) + ' BTC'
}

export default async function Image({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice
  const decoded = decode(invoice)

  const amount = decoded.amount || 0
  const description = decoded.description || 'No description'

  const geistSemiBold = await fetch(
    new URL('../../public/Geist-SemiBold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

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
            fontSize: '128px',
            fontWeight: '600'
          }}
        >
          ln.fyi
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '72px', fontWeight: '600', display: 'flex', gap: '16px' }}>
              ⚡️ {formatAmount(amount)}
            </div>
            <div style={{ color: '#666', fontSize: '32px' }}>Amount</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{ fontSize: '36px', fontWeight: '400', color: '#333', wordWrap: 'break-word' }}
            >
              {description}
            </div>
            <div style={{ color: '#666', fontSize: '32px' }}>Description</div>
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
