'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  {
    href: '/',
    label: 'Games',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    href: '/class-prep',
    label: 'Sessions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/smart-builder',
    label: 'Builder',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navigation - Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-semibold text-foreground text-lg hidden sm:block">
                Ecogram
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Theme toggle + Search hint */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm mr-2">
                <kbd className="px-2 py-1 bg-secondary rounded border border-border text-xs">
                  ⌘K
                </kbd>
                <span>Search</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-target',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
