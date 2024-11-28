export const INTERVALS = ['24h', '3d', '1w', '1m', '3m', '6m', '1y', '2y', '3y']

export type Interval = (typeof INTERVALS)[number]

type LatestStatVariation = Omit<StatsVariation, 'added'> & {
  added: string
  avg_capacity: number
  avg_fee_rate: number
  avg_base_fee_mtokens: number
  med_capacity: number
  med_fee_rate: number
  med_base_fee_mtokens: number
}

export type LatestStats = {
  latest: LatestStatVariation
  previous: LatestStatVariation
}

export async function getStats(): Promise<LatestStats> {
  const res = await fetch('https://mempool.space/api/v1/lightning/statistics/latest')
  const data = await res.json()
  return data
}

export type StatsVariation = {
  added: number // date expressed in number
  channel_count: number
  total_capacity: number
  tor_nodes: number
  clearnet_nodes: number
  unannounced_nodes: number
  clearnet_tor_nodes: number
  node_count: number
}

export async function getStatsVariations(interval: Interval): Promise<StatsVariation[]> {
  const res = await fetch(`https://mempool.space/api/v1/lightning/statistics/${interval}`)
  const data: StatsVariation[] = await res.json()
  return data.map((stat) => ({
    ...stat,
    node_count: stat.tor_nodes + stat.clearnet_nodes + stat.unannounced_nodes
  }))
}
