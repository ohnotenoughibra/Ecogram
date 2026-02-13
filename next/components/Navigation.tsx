'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart3, Zap, Plus, BookOpen, Users, BookMarked, ClipboardList, MoreHorizontal, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/', label: 'Games', icon: Home },
  { href: '/class-prep', label: 'Sessions', icon: Calendar },
  { href: '/smart-builder', label: 'Builder', icon: Zap },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
]

const moreNavItems = [
  { href: '/techniques', label: 'Techniques', icon: BookOpen },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/curriculum', label: 'Curriculum', icon: BookMarked },
  { href: '/class-log', label: 'Class Log', icon: ClipboardList },
  { href: '/seed', label: 'Seed Data', icon: Database },
]

export function Navigation() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on navigation
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  if (pathname?.startsWith('/timer')) return null

  const isMoreActive = moreNavItems.some((item) => pathname === item.href)

  return (
    <>
      {/* Desktop Navigation - Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 hidden sm:block bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-foreground text-lg tracking-tight">
                Ecogram
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}

              {/* More dropdown (desktop) */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                    isMoreActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  More
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden"
                    >
                      {moreNavItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'px-4 py-3 text-sm flex items-center gap-3 transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-secondary/50'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm mr-2">
                <kbd className="px-2 py-1 bg-secondary/50 rounded-md border border-border/50 text-xs font-mono">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur-xl border-t border-border/50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors touch-target relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 h-0.5 w-10 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </Link>
            )
          })}

          {/* More tab (mobile) */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors touch-target relative',
              isMoreActive
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
            {isMoreActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 h-0.5 w-10 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            )}
          </button>
        </div>

        {/* Mobile More menu */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 right-0 mb-0 bg-background border-t border-border/50 shadow-xl max-h-[60vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-1 p-3">
                {moreNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary/50 active:bg-secondary/50'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Floating Action Button (mobile) */}
      <Link
        href="/smart-builder"
        className={cn(
          'fixed bottom-20 right-4 z-50 sm:hidden',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-primary to-accent',
          'shadow-xl shadow-primary/30',
          'flex items-center justify-center',
          'active:scale-95 transition-transform duration-200',
          pathname === '/smart-builder' && 'hidden'
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </>
  )
}
