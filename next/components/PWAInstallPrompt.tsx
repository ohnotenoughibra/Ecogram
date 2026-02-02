'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(isIOSDevice)

    // Show iOS prompt if not installed
    if (isIOSDevice && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    // Handle beforeinstallprompt for Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xl">E</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground">Install Ecogram</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isIOS
                ? 'Tap the share button, then "Add to Home Screen"'
                : 'Add to your home screen for quick access'}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iOS instructions */}
        {isIOS && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-secondary rounded-lg">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-sm text-muted-foreground">
              Tap <span className="inline-flex items-center justify-center w-5 h-5 bg-accent rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </span> then "Add to Home Screen"
            </span>
          </div>
        )}

        {/* Install button for Android/Chrome */}
        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1">
              Not now
            </Button>
            <Button size="sm" onClick={handleInstall} className="flex-1">
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
