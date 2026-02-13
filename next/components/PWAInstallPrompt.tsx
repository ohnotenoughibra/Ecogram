'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui'
import { X, Share2, Download } from 'lucide-react'

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
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl shadow-black/20">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
            <span className="text-white font-bold text-xl">E</span>
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
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS instructions */}
        {isIOS && (
          <div className="flex items-center gap-2 mt-3 p-2.5 bg-secondary/50 rounded-xl border border-border/30">
            <Share2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Tap the share button, then &ldquo;Add to Home Screen&rdquo;
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
              <Download className="w-4 h-4 mr-1.5" />
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
