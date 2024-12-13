'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function ThemeWrapper({
  children,
  theme
}: {
  children: React.ReactNode
  theme: 'light' | 'dark'
}) {
  const { setTheme } = useTheme()
  useEffect(() => {
    setTheme(theme)
  }, [])

  return <>{children}</>
}
