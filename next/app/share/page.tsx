'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { Card, Badge } from '@/components/ui'
import { formatDate, formatDuration, capitalizeFirst } from '@/lib/utils'

interface SharedGame {
  name: string
  position: string
  difficulty: string
  category: string
  duration_minutes: number
  techniques: string[]
  description: string | null
}

interface SharedSession {
  name: string
  date: string
  focus: string | null
  skill_level: string | null
  description: string | null
  notes: string | null
  games: SharedGame[]
}

function ShareContent() {
  const searchParams = useSearchParams()
  const data = searchParams.get('data')

  const session = useMemo<SharedSession | null>(() => {
    if (!data) return null
    try {
      const decoded = decodeURIComponent(atob(data))
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }, [data])

  if (!session) {
    return (
      <div className="content-container">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Share Link</h1>
          <p className="text-muted-foreground">
            This share link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  const totalDuration = session.games.reduce((sum, g) => sum + g.duration_minutes, 0)

  return (
    <div className="content-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{session.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline">{formatDate(session.date)}</Badge>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{session.games.length} games</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formatDuration(totalDuration)}</span>
          {session.focus && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Focus: {session.focus}</span>
            </>
          )}
          {session.skill_level && (
            <Badge
              variant={
                session.skill_level === 'beginner'
                  ? 'success'
                  : session.skill_level === 'intermediate'
                  ? 'warning'
                  : 'danger'
              }
            >
              {session.skill_level}
            </Badge>
          )}
        </div>
        {session.description && (
          <p className="text-muted-foreground mt-3">{session.description}</p>
        )}
      </div>

      {/* Games */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-foreground">Games</h2>
        {session.games.map((game, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-muted-foreground font-mono">{index + 1}.</span>
                  <h3 className="font-semibold text-foreground">{game.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge
                    variant={
                      game.difficulty === 'beginner'
                        ? 'success'
                        : game.difficulty === 'intermediate'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {capitalizeFirst(game.difficulty)}
                  </Badge>
                  <Badge variant="outline">{capitalizeFirst(game.position)}</Badge>
                  <Badge variant="outline">{capitalizeFirst(game.category)}</Badge>
                </div>
                {game.description && (
                  <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                )}
                {game.techniques.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {game.techniques.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDuration(game.duration_minutes)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notes */}
      {session.notes && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-2">Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Shared from Ecogram - BJJ Training Game Library</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="content-container">
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ShareContent />
    </Suspense>
  )
}
