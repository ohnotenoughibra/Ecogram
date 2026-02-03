'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    const variants = {
      default: 'bg-secondary text-secondary-foreground',
      outline: 'bg-transparent border border-border text-foreground',
      success: 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30',
      danger: 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
