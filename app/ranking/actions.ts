'use server'

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

export async function getLiquidityRanking(): Promise<LightningNode[]> {
  const res = await fetch('https://mempool.space/api/v1/lightning/nodes/rankings/liquidity')
  const data: LightningNode[] = await res.json()
  return data
}

export async function getChannelRanking(): Promise<LightningNode[]> {
  const res = await fetch('https://mempool.space/api/v1/lightning/nodes/rankings/connectivity')
  const data: LightningNode[] = await res.json()
  return data
}
