export const INTERVALS = ['1m', '3m', '6m', '1y', '2y', '3y'] as const

export const INTERVALS_LABELS = {
  '1m': '1 month',
  '3m': '3 months',
  '6m': '6 months',
  '1y': '1 year',
  '2y': '2 years',
  '3y': '3 years'
}

export type Interval = (typeof INTERVALS)[number]
