'use client'

import { useState, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Trash2, Star } from 'lucide-react'

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
    icon: <Trash2 className="w-6 h-6" />,
    label: 'Delete',
    color: 'bg-error',
  },
  rightAction = {
    icon: <Star className="w-6 h-6" />,
    label: 'Favorite',
    color: 'bg-warning',
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
