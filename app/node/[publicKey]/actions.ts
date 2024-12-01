'use server'

type LightningNodeWithMetadata = {
  public_key: string
  alias: string
  first_seen: number
  updated_at: number
  color: string
  sockets: string
  as_number: number
  city_id: number
  country_id: number
  subdivision_id: number
  longitude: number | null
  latitude: number | null
  iso_code: string | null
  as_organization: string | null
  city: {
    de: string | null
    en: string | null
    es: string | null
    fr: string | null
  } | null
  country: {
    de: string | null
    en: string | null
    es: string | null
    fr: string | null
  } | null
  active_channel_count: number
  capacity: number
  opened_channel_count: number
  closed_channel_count: number
}

export async function getLightningNode(publicKey: string): Promise<LightningNodeWithMetadata> {
  const response = await fetch(`https://mempool.space/api/v1/lightning/nodes/${publicKey}`)
  const data: LightningNodeWithMetadata = await response.json()
  return data
}
