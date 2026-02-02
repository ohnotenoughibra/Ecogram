'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useClassPrepStore, useGameStore } from '@/store'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/database'

export default function TimerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')

  const { classPreps } = useClassPrepStore()
  const { games } = useGameStore()

  const [sessionGames, setSessionGames] = useState<Game[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Load session games
  useEffect(() => {
    if (sessionId) {
      const session = classPreps.find((p) => p.id === sessionId)
      if (session) {
        const orderedGames = session.game_ids
          .map((id) => games.find((g) => g.id === id))
          .filter(Boolean) as Game[]
        setSessionGames(orderedGames)
        if (orderedGames.length > 0) {
          setTimeRemaining(orderedGames[0].duration_minutes * 60)
        }
      }
    }
  }, [sessionId, classPreps, games])

  // Request wake lock to keep screen on
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isRunning) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch (e) {
          console.log('Wake lock not supported')
        }
      }
    }

    if (isRunning) {
      requestWakeLock()
    }

    return () => {
      wakeLockRef.current?.release()
    }
  }, [isRunning])

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Play sound and move to next
          playBeep()
          return 0
        }
        // Warning beep at 10 seconds
        if (prev === 11) {
          playBeep()
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining])

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && isRunning && currentIndex < sessionGames.length - 1) {
      setTimeout(() => {
        handleNext()
      }, 2000)
    }
  }, [timeRemaining, isRunning, currentIndex, sessionGames.length])

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const handleNext = useCallback(() => {
    if (currentIndex < sessionGames.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setTimeRemaining(sessionGames[nextIndex].duration_minutes * 60)
    } else {
      setIsRunning(false)
    }
  }, [currentIndex, sessionGames])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setTimeRemaining(sessionGames[prevIndex].duration_minutes * 60)
    }
  }, [currentIndex, sessionGames])

  const handlePlayPause = () => {
    setIsRunning((prev) => !prev)
  }

  const handleReset = () => {
    setTimeRemaining(sessionGames[currentIndex].duration_minutes * 60)
    setIsRunning(false)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentGame = sessionGames[currentIndex]
  const progress = currentGame
    ? ((currentGame.duration_minutes * 60 - timeRemaining) / (currentGame.duration_minutes * 60)) * 100
    : 0

  if (!sessionId || sessionGames.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">No Session Selected</h1>
          <p className="text-muted-foreground mb-4">Select a session from Class Prep to start the timer</p>
          <Button onClick={() => router.push('/class-prep')}>Go to Sessions</Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col bg-background select-none',
        isFullscreen && 'fixed inset-0 z-50'
      )}
      // Swipe gesture handlers
      onTouchStart={(e) => {
        const touch = e.touches[0]
        ;(e.currentTarget as any)._touchStartX = touch.clientX
      }}
      onTouchEnd={(e) => {
        const startX = (e.currentTarget as any)._touchStartX
        const endX = e.changedTouches[0].clientX
        const diff = endX - startX

        if (Math.abs(diff) > 100) {
          if (diff > 0) {
            handlePrev()
          } else {
            handleNext()
          }
        }
      }}
    >
      {/* Hidden audio element for beeps */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Ch4GHfnx8fYOHioqHhYN+enp8f4OGh4iHhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoa=" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg touch-target"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Game {currentIndex + 1} of {sessionGames.length}
          </p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg touch-target"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Game name */}
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
          {currentGame?.name}
        </h1>

        {/* Game info */}
        <div className="flex items-center gap-2 mb-8">
          <span className="px-2 py-1 text-sm bg-secondary rounded text-secondary-foreground">
            {currentGame?.position}
          </span>
          <span className="px-2 py-1 text-sm bg-secondary rounded text-secondary-foreground">
            {currentGame?.difficulty}
          </span>
        </div>

        {/* Timer display */}
        <div
          className={cn(
            'text-7xl sm:text-9xl font-mono font-bold mb-8 transition-colors',
            timeRemaining <= 10 ? 'text-red-500' : 'text-foreground'
          )}
        >
          {formatTime(timeRemaining)}
        </div>

        {/* Description */}
        {currentGame?.description && (
          <p className="text-muted-foreground max-w-md mb-8 text-sm sm:text-base">
            {currentGame.description}
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-4 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 touch-target"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handlePlayPause}
            className="p-6 rounded-full bg-primary text-primary-foreground touch-target"
          >
            {isRunning ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === sessionGames.length - 1}
            className="p-4 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 touch-target"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Reset timer
        </button>
      </div>

      {/* Game list preview */}
      <div className="border-t border-border p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sessionGames.map((game, index) => (
            <button
              key={game.id}
              onClick={() => {
                setCurrentIndex(index)
                setTimeRemaining(game.duration_minutes * 60)
                setIsRunning(false)
              }}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : index < currentIndex
                  ? 'bg-muted text-muted-foreground line-through'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {index + 1}. {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Swipe left/right to change games
      </p>
    </div>
  )
}
