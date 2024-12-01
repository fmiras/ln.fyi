import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from 'next-themes'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
})

const geistMono = Geist({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'Lightning Network Statistics | ln.fyi',
  description:
    'Real-time Lightning Network statistics including node count, channel capacity, fee rates, and top nodes by capacity and channels.',
  openGraph: {
    title: 'ln.fyi - Lightning Network Statistics',
    siteName: 'ln.fyi',
    description:
      'Real-time Lightning Network statistics including node count, channel capacity, fee rates, and top nodes by capacity and channels.',
    type: 'website',
    locale: 'en_US',
    url: 'https://ln.fyi'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ln.fyi - Lightning Network Statistics',
    description:
      'Real-time Lightning Network statistics including node count, channel capacity, fee rates, and top nodes by capacity and channels.',
    creator: '@fefomiras'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
