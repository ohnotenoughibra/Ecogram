'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4 sm:max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container - centered on desktop, bottom sheet on mobile */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={cn(
            'relative w-full bg-card rounded-t-xl sm:rounded-xl shadow-2xl',
            'border-t sm:border border-border',
            'animate-slide-up max-h-[90vh] overflow-y-auto',
            sizes[size]
          )}
        >
          {/* Header */}
          {title && (
            <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card z-10">
              <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="touch-target p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-4 sm:px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3',
        'px-4 sm:px-6 py-4 border-t border-border -mx-4 sm:-mx-6 -mb-4 mt-4',
        'sticky bottom-0 bg-card',
        className
      )}
    >
      {children}
    </div>
  )
}
