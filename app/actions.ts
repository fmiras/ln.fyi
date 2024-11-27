export const INTERVALS = ['24h', '3d', '1w', '1m', '3m', '6m', '1y', '2y', '3y']

export type Interval = (typeof INTERVALS)[number]

export async function getStats() {
  const res = await fetch('https://mempool.space/api/v1/lightning/statistics/latest')
  const data = await res.json()
  return data
}

export async function getStatsVariations(interval: Interval) {
  const res = await fetch(`https://mempool.space/api/v1/lightning/statistics/${interval}`)
  const data = await res.json()
  return data
}
