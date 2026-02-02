'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Games' },
  { href: '/class-prep', label: 'Class Prep' },
  { href: '/smart-builder', label: 'Smart Builder' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">E</span>
            </div>
            <span className="font-semibold text-white text-lg hidden sm:block">
              Ecogram
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search shortcut hint */}
          <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm">
            <kbd className="px-2 py-1 bg-[#1A1A1A] rounded border border-[#262626] text-xs">
              ⌘K
            </kbd>
            <span>Search</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
