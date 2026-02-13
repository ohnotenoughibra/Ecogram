'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Mode = 'light' | 'dark'
type ColorTheme = 'steel' | 'rose' | 'emerald' | 'amber'

interface ThemeContextType {
  mode: Mode
  colorTheme: ColorTheme
  toggleMode: () => void
  setMode: (mode: Mode) => void
  setColorTheme: (theme: ColorTheme) => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colorTheme: 'steel',
  toggleMode: () => {},
  setMode: () => {},
  setColorTheme: () => {},
  mounted: false,
})

export const colorThemes: { id: ColorTheme; label: string; primary: string; accent: string }[] = [
  { id: 'steel', label: 'Steel', primary: '#3B82F6', accent: '#06B6D4' },
  { id: 'rose', label: 'Rose', primary: '#EC4899', accent: '#F43F5E' },
  { id: 'emerald', label: 'Emerald', primary: '#10B981', accent: '#22C55E' },
  { id: 'amber', label: 'Amber', primary: '#F59E0B', accent: '#F97316' },
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('dark')
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('steel')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedMode = localStorage.getItem('ecogram-mode') as Mode | null
    const storedTheme = localStorage.getItem('ecogram-color-theme') as ColorTheme | null

    if (storedMode) {
      setModeState(storedMode)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setModeState('light')
    }

    if (storedTheme) {
      setColorThemeState(storedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (mode === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
    localStorage.setItem('ecogram-mode', mode)
  }, [mode, mounted])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    if (colorTheme === 'steel') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', colorTheme)
    }
    localStorage.setItem('ecogram-color-theme', colorTheme)
  }, [colorTheme, mounted])

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode)
  }, [])

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, toggleMode, setMode, setColorTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
