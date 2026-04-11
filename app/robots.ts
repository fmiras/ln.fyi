import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/lnbc1', '/lntb1', '/lnbcrt1']
      }
    ],
    sitemap: 'https://ln.fyi/sitemap.xml',
    host: 'https://ln.fyi'
  }
}
