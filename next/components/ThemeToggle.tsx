'use client'

import { Sun, Moon, Palette } from 'lucide-react'
import { useTheme, colorThemes } from './ThemeProvider'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
  const { mode, toggleMode, colorTheme, setColorTheme } = useTheme()
  const [showPalette, setShowPalette] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex items-center gap-1" ref={paletteRef}>
      <button
        onClick={toggleMode}
        className="touch-target flex items-center justify-center p-2 rounded-lg
                   text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      >
        {mode === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <button
        onClick={() => setShowPalette(!showPalette)}
        className="touch-target flex items-center justify-center p-2 rounded-lg
                   text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        aria-label="Change color theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {showPalette && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl z-50 animate-scale-in">
          <p className="text-xs text-muted-foreground px-2 pb-2 font-medium">Color Theme</p>
          <div className="flex gap-2">
            {colorThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setColorTheme(theme.id)
                  setShowPalette(false)
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  colorTheme === theme.id
                    ? 'border-foreground scale-110'
                    : 'border-transparent'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                }}
                title={theme.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
