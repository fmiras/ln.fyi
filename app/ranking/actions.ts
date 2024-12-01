'use server'

import { LightningNode } from '../types'

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
