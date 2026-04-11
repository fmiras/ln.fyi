import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from 'next-themes'

import { Toaster } from '@/components/ui/toaster'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
})

const SITE_URL = 'https://ln.fyi'
const SITE_NAME = 'ln.fyi'
const TITLE = 'ln.fyi — Lightning Network Stats, Rankings & Learning'
const DESCRIPTION =
  'Real-time Lightning Network statistics, top node rankings, capacity trends, ISP & country breakdowns, invoice decoder, and clear Lightning Network education. Data from mempool.space and amboss.space.'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcf9f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0b09' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark'
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — ln.fyi'
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Lightning Network',
    'Bitcoin',
    'LN stats',
    'lightning node',
    'mempool.space',
    'amboss.space',
    'channel capacity',
    'BOLT11',
    'invoice decoder',
    'lightning routing',
    'ln.fyi'
  ],
  authors: [{ name: 'Fede Miras', url: 'https://twitter.com/fefomiras' }],
  creator: 'Fede Miras',
  publisher: 'ln.fyi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  alternates: {
    canonical: SITE_URL
  },
  openGraph: {
    title: TITLE,
    siteName: SITE_NAME,
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_US',
    url: SITE_URL
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@fefomiras',
    site: '@fefomiras'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/invoice?raw_invoice={raw_invoice}`,
      'query-input': 'required name=raw_invoice'
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-[0.35] dark:opacity-[0.15]" />
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
          <SiteNav />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <Analytics />
          <SpeedInsights />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
