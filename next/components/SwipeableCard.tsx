'use client'

import { useState, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: ReactNode
    label: string
    color: string
  }
  rightAction?: {
    icon: ReactNode
    label: string
    color: string
  }
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <TrashIcon />,
    label: 'Delete',
    color: 'bg-red-500',
  },
  rightAction = {
    icon: <StarIcon />,
    label: 'Favorite',
    color: 'bg-yellow-500',
  },
  className,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const SWIPE_THRESHOLD = 80
  const MAX_SWIPE = 120

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isHorizontalSwipe.current = null
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - startX.current
    const diffY = currentY - startY.current

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY)
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault()
      const bounded = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX))
      setTranslateX(bounded)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    if (translateX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight()
    } else if (translateX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft()
    }

    setTranslateX(0)
  }

  const getActionOpacity = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      return Math.min(1, translateX / SWIPE_THRESHOLD)
    }
    return Math.min(1, -translateX / SWIPE_THRESHOLD)
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Left action (shown when swiping right) */}
      {onSwipeRight && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-start px-4',
            rightAction.color
          )}
          style={{
            opacity: getActionOpacity('right'),
            width: Math.max(0, translateX),
          }}
        >
          <div className="flex flex-col items-center text-white">
            {rightAction.icon}
            <span className="text-xs mt-1">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action (shown when swiping left) */}
      {onSwipeLeft && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end px-4',
            leftAction.color
          )}
          style={{
            opacity: getActionOpacity('left'),
            width: Math.max(0, -translateX),
          }}
        >
          <div className="flex flex-col items-center text-white">
            {leftAction.icon}
            <span className="text-xs mt-1">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'relative bg-card transition-transform',
          !isDragging && 'duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
