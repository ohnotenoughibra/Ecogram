'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number | null
  onRate?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ rating, onRate, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const displayRating = hoverRating ?? rating ?? 0

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(null)}
          className={`${readonly ? '' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= displayRating
                ? 'text-warning fill-warning'
                : 'text-muted-foreground/40'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}
