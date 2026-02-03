'use client'

import { useEffect, useMemo } from 'react'
import { useGameStore, useClassPrepStore } from '@/store'
import { Card, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { Position } from '@/types/database'

const positionLabels: Record<Position, string> = {
  guard: 'Guard',
  'half-guard': 'Half Guard',
  mount: 'Mount',
  'side-control': 'Side Control',
  back: 'Back',
  turtle: 'Turtle',
  standing: 'Standing',
  other: 'Other',
}

export default function AnalyticsPage() {
  const { games, fetchGames } = useGameStore()
  const { classPreps, fetchClassPreps } = useClassPrepStore()

  useEffect(() => {
    fetchGames()
    fetchClassPreps()
  }, [fetchGames, fetchClassPreps])

  // Calculate analytics
  const analytics = useMemo(() => {
    // Most played games
    const mostPlayed = [...games]
      .filter((g) => g.play_count > 0)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5)

    // Best rated games
    const bestRated = [...games]
      .filter((g) => g.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)

    // Position coverage
    const positionCounts: Record<Position, number> = {
      guard: 0,
      'half-guard': 0,
      mount: 0,
      'side-control': 0,
      back: 0,
      turtle: 0,
      standing: 0,
      other: 0,
    }
    games.forEach((g) => {
      positionCounts[g.position]++
    })

    // Games played per position in class preps
    const positionUsage: Record<Position, number> = {
      guard: 0,
      'half-guard': 0,
      mount: 0,
      'side-control': 0,
      back: 0,
      turtle: 0,
      standing: 0,
      other: 0,
    }
    classPreps.forEach((prep) => {
      prep.game_ids.forEach((gameId) => {
        const game = games.find((g) => g.id === gameId)
        if (game) {
          positionUsage[game.position]++
        }
      })
    })

    // Recent sessions
    const recentSessions = [...classPreps]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    // Total stats
    const totalGames = games.length
    const totalSessions = classPreps.length
    const totalPlayCount = games.reduce((sum, g) => sum + g.play_count, 0)
    const favoriteCount = games.filter((g) => g.is_favorite).length

    return {
      mostPlayed,
      bestRated,
      positionCounts,
      positionUsage,
      recentSessions,
      totalGames,
      totalSessions,
      totalPlayCount,
      favoriteCount,
    }
  }, [games, classPreps])

  const maxPositionCount = Math.max(...Object.values(analytics.positionCounts), 1)
  const maxPositionUsage = Math.max(...Object.values(analytics.positionUsage), 1)

  return (
    <div className="content-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your training patterns and game usage
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <div className="text-3xl font-bold text-foreground">{analytics.totalGames}</div>
          <div className="text-sm text-muted-foreground">Total Games</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-foreground">{analytics.totalSessions}</div>
          <div className="text-sm text-muted-foreground">Sessions Planned</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-foreground">{analytics.totalPlayCount}</div>
          <div className="text-sm text-muted-foreground">Total Plays</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-foreground">{analytics.favoriteCount}</div>
          <div className="text-sm text-muted-foreground">Favorites</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Played Games */}
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Most Played Games</h2>
          {analytics.mostPlayed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No games played yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.mostPlayed.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5">{index + 1}.</span>
                    <div>
                      <div className="font-medium text-foreground">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {positionLabels[game.position]}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{game.play_count} plays</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Best Rated Games */}
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Best Rated Games</h2>
          {analytics.bestRated.length === 0 ? (
            <p className="text-muted-foreground text-sm">No games rated yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.bestRated.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5">{index + 1}.</span>
                    <div>
                      <div className="font-medium text-foreground">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {positionLabels[game.position]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (game.rating || 0)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Position Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Games by Position</h2>
          <div className="space-y-3">
            {(Object.entries(analytics.positionCounts) as [Position, number][]).map(
              ([position, count]) => (
                <div key={position}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{positionLabels[position]}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(count / maxPositionCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Position Usage in Sessions</h2>
          <div className="space-y-3">
            {(Object.entries(analytics.positionUsage) as [Position, number][]).map(
              ([position, count]) => (
                <div key={position}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{positionLabels[position]}</span>
                    <span className="text-sm text-muted-foreground">{count} uses</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(count / maxPositionUsage) * 100}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h2>
        {analytics.recentSessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sessions planned yet</p>
        ) : (
          <div className="space-y-3">
            {analytics.recentSessions.map((session) => {
              const sessionGames = session.game_ids
                .map((id) => games.find((g) => g.id === id))
                .filter(Boolean)
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-medium text-foreground">{session.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(session.date)} • {sessionGames.length} games
                      {session.focus && ` • ${session.focus}`}
                    </div>
                  </div>
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
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
