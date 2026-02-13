'use client'

import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
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

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4 sm:max-w-2xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'relative w-full bg-card/95 backdrop-blur-xl',
                'rounded-t-3xl sm:rounded-3xl shadow-2xl',
                'border-t sm:border border-border/50',
                'max-h-[90vh] overflow-y-auto',
                sizes[size]
              )}
            >
              {title && (
                <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-card/95 backdrop-blur-xl z-10 rounded-t-3xl">
                  <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
                  <button
                    onClick={onClose}
                    className="touch-target p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="px-4 sm:px-6 py-4">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
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
        'px-4 sm:px-6 py-4 border-t border-border/50 -mx-4 sm:-mx-6 -mb-4 mt-4',
        'sticky bottom-0 bg-card/95 backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  )
}
