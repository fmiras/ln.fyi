import type { MetadataRoute } from 'next'

const BASE = 'https://ln.fyi'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1
    },
    {
      url: `${BASE}/ranking`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9
    },
    {
      url: `${BASE}/learn`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${BASE}/invoice`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ]
}
