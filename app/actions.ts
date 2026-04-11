'use server'

import { Interval } from '../lib/types'

const MEMPOOL_BASE = 'https://mempool.space/api/v1/lightning'

type LatestStatsVariation = {
  id: number
  added: string
  channel_count: number
  node_count: number
  total_capacity: number
  tor_nodes: number
  clearnet_nodes: number
  unannounced_nodes: number
  avg_capacity: number
  avg_fee_rate: number
  avg_base_fee_mtokens: number
  med_capacity: number
  med_fee_rate: number
  med_base_fee_mtokens: number
  clearnet_tor_nodes: number
}

type LatestStats = {
  latest: LatestStatsVariation
  previous?: LatestStatsVariation
}

export async function getStats(): Promise<LatestStats> {
  const res = await fetch(`${MEMPOOL_BASE}/statistics/latest`, {
    cache: 'no-store'
  })
  const data = await res.json()
  return data
}

export type StatsVariation = {
  added: number
  channel_count: number
  total_capacity: number
  tor_nodes: number
  clearnet_nodes: number
  unannounced_nodes: number
  clearnet_tor_nodes: number
  node_count: number
  avg_capacity?: number
  avg_fee_rate?: number
}

export async function getStatsVariations(interval: Interval): Promise<StatsVariation[]> {
  const res = await fetch(`${MEMPOOL_BASE}/statistics/${interval}`, {
    cache: 'no-store'
  })
  const data: StatsVariation[] = await res.json()
  return data.map((stat) => ({
    ...stat,
    node_count: stat.tor_nodes + stat.clearnet_nodes + stat.unannounced_nodes
  }))
}

export type LightningNodeSummary = {
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

export type NodesRanking = {
  topByCapacity: {
    publicKey: string
    alias: string
    capacity: number
  }[]
  topByChannels: LightningNodeSummary[]
}

export async function getNodesRanking(): Promise<NodesRanking> {
  const res = await fetch(`${MEMPOOL_BASE}/nodes/rankings`, {
    cache: 'no-store'
  })
  const data: NodesRanking = await res.json()
  return data
}

export type CountryEntry = {
  name: { en: string; de?: string; es?: string; fr?: string }
  iso: string
  count: number
  share: number
  capacity: number
}

export async function getNodesPerCountry(): Promise<CountryEntry[]> {
  try {
    const res = await fetch(`${MEMPOOL_BASE}/nodes/countries`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const raw = (await res.json()) as Array<{
      name: { en: string; de?: string; es?: string; fr?: string }
      iso: string
      count: number
      share: number
      capacity: number
    }>
    return raw.slice(0, 20)
  } catch (error) {
    console.error('[getNodesPerCountry]', error)
    return []
  }
}

export type ISPEntry = {
  ispId: string
  name: string
  count: number
  capacity: number
  share: number
}

export async function getNodesPerISP(): Promise<ISPEntry[]> {
  try {
    const res = await fetch(`${MEMPOOL_BASE}/nodes/isp-ranking`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const raw = (await res.json()) as {
      clearnetCapacity: number
      unknownCapacity: number
      torCapacity: number
      ispRanking: Array<[string, string, number, number]>
    }
    const total = raw.ispRanking.reduce((acc, [, , capacity]) => acc + capacity, 0) || 1
    return raw.ispRanking
      .map(([ispId, name, capacity, count]) => ({
        ispId,
        name,
        capacity,
        count,
        share: (capacity / total) * 100
      }))
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 15)
  } catch (error) {
    console.error('[getNodesPerISP]', error)
    return []
  }
}
