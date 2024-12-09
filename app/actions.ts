'use server'

import { Interval } from '../lib/types'

type LatestStatVariation = Omit<StatsVariation, 'added'> & {
  added: string // date expressed in string
  avg_capacity: number
  avg_fee_rate: number
  avg_base_fee_mtokens: number
  med_capacity: number
  med_fee_rate: number
  med_base_fee_mtokens: number
}

type LatestStats = {
  latest: LatestStatVariation
  previous?: LatestStatVariation
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

type LightningNode = {
  publicKey: string
  alias: string
  firstSeen: number
  updatedAt: number
  channels: number
  capacity: number
  city: {
    de: string
    en: string
    es: string
    fr: string
  } | null
  country: {
    de: string
    en: string
    es: string
    fr: string
  } | null
  iso_code: string | null
  subdivision: string | null
}

type NodesRanking = {
  topByCapacity: {
    publicKey: string
    alias: string
    capacity: number
  }[]
  topByChannels: LightningNode[]
}

export async function getNodesRanking(): Promise<NodesRanking> {
  const res = await fetch('https://mempool.space/api/v1/lightning/nodes/rankings')
  const data: NodesRanking = await res.json()
  return data
}
