'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'

const shortcuts = [
  { key: 'g', label: 'Games', href: '/' },
  { key: 's', label: 'Sessions', href: '/class-prep' },
  { key: 'b', label: 'Smart Builder', href: '/smart-builder' },
  { key: 'a', label: 'Analytics', href: '/analytics' },
  { key: 't', label: 'Techniques', href: '/techniques' },
  { key: 'u', label: 'Students', href: '/students' },
  { key: 'c', label: 'Curriculum', href: '/curriculum' },
  { key: 'l', label: 'Class Log', href: '/class-log' },
]

export function KeyboardShortcuts() {
  const router = useRouter()
  const { toggleMode } = useTheme()
  const [showHelp, setShowHelp] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape in search
        if (e.key === 'Escape' && searchOpen) {
          setSearchOpen(false)
          setSearchQuery('')
        }
        return
      }

      const isMeta = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+K: Quick search/navigate
      if (isMeta && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
        setSearchQuery('')
        return
      }

      // Escape: close modals/search
      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false)
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery('')
        }
        return
      }

      // ?: Show shortcuts help
      if (e.key === '?') {
        setShowHelp((prev) => !prev)
        return
      }

      // d: Toggle dark/light
      if (e.key === 'd' && !isMeta) {
        toggleMode()
        return
      }

      // Navigation shortcuts
      if (!isMeta) {
        for (const shortcut of shortcuts) {
          if (e.key === shortcut.key) {
            router.push(shortcut.href)
            return
          }
        }
      }
    },
    [router, toggleMode, showHelp, searchOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  const filteredShortcuts = searchQuery
    ? shortcuts.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : shortcuts

  return (
    <>
      {/* Quick Navigate (Cmd+K) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] flex items-start justify-center pt-[15vh] p-4"
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery('') }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative bg-card border border-border/50 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <Keyboard className="w-5 h-5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Navigate to..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredShortcuts.length > 0) {
                      router.push(filteredShortcuts[0].href)
                      setSearchOpen(false)
                      setSearchQuery('')
                    }
                  }}
                />
                <kbd className="px-2 py-1 bg-secondary/50 rounded-md border border-border/50 text-xs font-mono text-muted-foreground">
                  esc
                </kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredShortcuts.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      router.push(s.href)
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <span>{s.label}</span>
                    <kbd className="px-2 py-0.5 bg-secondary/50 rounded-md border border-border/50 text-xs font-mono text-muted-foreground">
                      {s.key}
                    </kbd>
                  </button>
                ))}
                {filteredShortcuts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No matches found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative bg-card border border-border/50 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  Keyboard Shortcuts
                </h2>
                <button onClick={() => setShowHelp(false)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Navigation</h3>
                  <div className="space-y-1.5">
                    {shortcuts.map((s) => (
                      <div key={s.key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{s.label}</span>
                        <kbd className="px-2.5 py-1 bg-secondary/50 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground min-w-[2rem] text-center">
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Global</h3>
                  <div className="space-y-1.5">
                    {[
                      { keys: ['Cmd', 'K'], label: 'Quick Navigate' },
                      { keys: ['d'], label: 'Toggle Dark/Light' },
                      { keys: ['?'], label: 'Show Shortcuts' },
                      { keys: ['Esc'], label: 'Close Modal/Dialog' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k) => (
                            <kbd key={k} className="px-2.5 py-1 bg-secondary/50 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground min-w-[2rem] text-center">
                              {k === 'Cmd' ? (typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl') : k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
