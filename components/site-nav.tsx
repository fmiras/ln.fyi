'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { ModeToggle } from '@/components/mode-toggle'

const NAV_LINKS = [
  { href: '/', label: 'Network' },
  { href: '/ranking', label: 'Rankings' },
  { href: '/learn', label: 'Learn' },
  { href: '/invoice', label: 'Decode' }
] as const

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? 'backdrop-blur-xl bg-background/70 border-b border-border/60'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        className="container mx-auto flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="ln.fyi home"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm shadow-orange-500/30">
            <Zap className="h-4 w-4 text-white fill-white" />
          </span>
          <span className="text-base sm:text-lg font-semibold tracking-tight">
            ln<span className="text-orange-500">.</span>fyi
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="https://insigh.to/b/lnfyi"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-md border border-border bg-background/50 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-orange-500/40 transition-colors"
          >
            Feedback
          </Link>
          <ModeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/50 text-foreground"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://insigh.to/b/lnfyi"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              Leave feedback
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
