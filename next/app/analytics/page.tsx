'use client'

import { useEffect, useMemo } from 'react'
import { useGameStore, useClassPrepStore } from '@/store'
import { Card, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Trophy, Flame, Star, Target, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Position } from '@/types/database'

const positionLabels: Record<Position, string> = {
  guard: 'Guard',
  'half-guard': 'Half Guard',
  mount: 'Mount',
  'side-control': 'Side Control',
  back: 'Back',
  turtle: 'Turtle',
  standing: 'Standing',
  'open-guard': 'Open Guard',
  'closed-guard': 'Closed Guard',
  clinch: 'Clinch',
  other: 'Other',
}

export default function AnalyticsPage() {
  const { games, fetchGames } = useGameStore()
  const { classPreps, fetchClassPreps } = useClassPrepStore()

  useEffect(() => {
    fetchGames()
    fetchClassPreps()
  }, [fetchGames, fetchClassPreps])

  const analytics = useMemo(() => {
    const mostPlayed = [...games]
      .filter((g) => g.play_count > 0)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5)

    const bestRated = [...games]
      .filter((g) => g.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)

    const positionCounts: Record<Position, number> = {
      guard: 0, 'half-guard': 0, mount: 0, 'side-control': 0,
      back: 0, turtle: 0, standing: 0, 'open-guard': 0, 'closed-guard': 0, clinch: 0, other: 0,
    }
    games.forEach((g) => { positionCounts[g.position]++ })

    const positionUsage: Record<Position, number> = {
      guard: 0, 'half-guard': 0, mount: 0, 'side-control': 0,
      back: 0, turtle: 0, standing: 0, 'open-guard': 0, 'closed-guard': 0, clinch: 0, other: 0,
    }
    classPreps.forEach((prep) => {
      prep.game_ids.forEach((gameId: string) => {
        const game = games.find((g) => g.id === gameId)
        if (game) positionUsage[game.position]++
      })
    })

    const recentSessions = [...classPreps]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return {
      mostPlayed,
      bestRated,
      positionCounts,
      positionUsage,
      recentSessions,
      totalGames: games.length,
      totalSessions: classPreps.length,
      totalPlayCount: games.reduce((sum, g) => sum + g.play_count, 0),
      favoriteCount: games.filter((g) => g.is_favorite).length,
    }
  }, [games, classPreps])

  const maxPositionCount = Math.max(...Object.values(analytics.positionCounts), 1)
  const maxPositionUsage = Math.max(...Object.values(analytics.positionUsage), 1)

  const statCards = [
    { label: 'Total Games', value: analytics.totalGames, icon: Target, color: 'text-primary' },
    { label: 'Sessions Planned', value: analytics.totalSessions, icon: BarChart3, color: 'text-accent' },
    { label: 'Total Plays', value: analytics.totalPlayCount, icon: Flame, color: 'text-warning' },
    { label: 'Favorites', value: analytics.favoriteCount, icon: Star, color: 'text-warning' },
  ]

  return (
    <div className="content-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="gradient-text">Analytics Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your training patterns and game usage
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center">
                <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Played Games */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Most Played Games</h2>
          </div>
          {analytics.mostPlayed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No games played yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.mostPlayed.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                      {index + 1}
                    </span>
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
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Best Rated Games</h2>
          </div>
          {analytics.bestRated.length === 0 ? (
            <p className="text-muted-foreground text-sm">No games rated yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.bestRated.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-xs text-warning font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {positionLabels[game.position]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (game.rating || 0)
                            ? 'text-warning fill-warning'
                            : 'text-muted-foreground/30'
                        }`}
                      />
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxPositionCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxPositionUsage) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-success to-accent rounded-full"
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
                .map((id: string) => games.find((g) => g.id === id))
                .filter(Boolean)
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <div className="font-medium text-foreground">{session.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(session.date)} &middot; {sessionGames.length} games
                      {session.focus && ` \u00B7 ${session.focus}`}
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
