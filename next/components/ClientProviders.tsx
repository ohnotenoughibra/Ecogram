'use client'

import { useEffect } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './Toast'
import { PWAInstallPrompt } from './PWAInstallPrompt'
import { KeyboardShortcuts } from './KeyboardShortcuts'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }
  }, [])

  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <PWAInstallPrompt />
        <KeyboardShortcuts />
      </ToastProvider>
    </ThemeProvider>
  )
}
