'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useClassPrepStore, useGameStore } from '@/store'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/database'

function TimerContent() {
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

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          playBeep()
          return 0
        }
        if (prev === 11) {
          playBeep()
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining])

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
      <div className="min-h-screen flex items-center justify-center bg-background bg-mesh p-4">
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
        'min-h-screen flex flex-col bg-background bg-mesh select-none',
        isFullscreen && 'fixed inset-0 z-50'
      )}
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
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Ch4GHfnx8fYOHioqHhYN+enp8f4OGh4iHhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoa=" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <button
          onClick={() => router.back()}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors touch-target"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Game {currentIndex + 1} of {sessionGames.length}
          </p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors touch-target"
        >
          {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
          {currentGame?.name}
        </h1>

        <div className="flex items-center gap-2 mb-8">
          <span className="px-2.5 py-0.5 text-sm bg-primary/10 border border-primary/20 rounded-full text-primary">
            {currentGame?.position}
          </span>
          <span className="px-2.5 py-0.5 text-sm bg-secondary rounded-full text-secondary-foreground">
            {currentGame?.difficulty}
          </span>
        </div>

        <div
          className={cn(
            'text-7xl sm:text-9xl font-mono font-bold mb-8 transition-colors tabular-nums',
            timeRemaining <= 10 ? 'text-error' : 'text-foreground'
          )}
        >
          {formatTime(timeRemaining)}
        </div>

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
            className="p-4 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 touch-target hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-6 rounded-full bg-gradient-to-br from-primary to-accent text-white touch-target shadow-xl shadow-primary/30 active:scale-95 transition-transform"
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
            className="p-4 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 touch-target hover:bg-secondary/80 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={handleReset}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset timer
        </button>
      </div>

      {/* Game pills */}
      <div className="border-t border-border/50 p-4 overflow-x-auto">
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
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200',
                index === currentIndex
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : index < currentIndex
                  ? 'bg-secondary/50 text-muted-foreground line-through'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {index + 1}. {game.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Swipe left/right to change games
      </p>
    </div>
  )
}

function TimerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-mesh">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

export default function TimerPage() {
  return (
    <Suspense fallback={<TimerLoading />}>
      <TimerContent />
    </Suspense>
  )
}
