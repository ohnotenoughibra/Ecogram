'use client'

import { useEffect, useMemo } from 'react'
import { useGameStore, useClassPrepStore, useClassLogStore, useTechniqueStore, useStudentStore } from '@/store'
import { Card, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Trophy, Flame, Star, Target, BarChart3, Zap, Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Position, Intensity } from '@/types/database'

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

const intensityColors: Record<Intensity, string> = {
  low: 'bg-success/20 text-success',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-error/20 text-error',
}

export default function AnalyticsPage() {
  const { games, fetchGames } = useGameStore()
  const { classPreps, fetchClassPreps } = useClassPrepStore()
  const { classLogs, fetchClassLogs } = useClassLogStore()
  const { techniques, fetchTechniques } = useTechniqueStore()
  const { students, fetchStudents } = useStudentStore()

  useEffect(() => {
    fetchGames()
    fetchClassPreps()
    fetchClassLogs()
    fetchTechniques()
    fetchStudents()
  }, [fetchGames, fetchClassPreps, fetchClassLogs, fetchTechniques, fetchStudents])

  const analytics = useMemo(() => {
    // ─── Existing: most played, best rated, position counts ───
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

    // ─── Phase 5: Technique Frequency from ClassLogs ───
    const techniqueFreq: Record<string, number> = {}
    classLogs.forEach((log) => {
      log.techniques_drilled.forEach((techName) => {
        techniqueFreq[techName] = (techniqueFreq[techName] || 0) + 1
      })
    })
    const topTechniques = Object.entries(techniqueFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    const maxTechFreq = topTechniques.length > 0 ? topTechniques[0][1] : 1

    // ─── Phase 5: Intensity Trends (last 12 logs) ───
    const recentLogs = [...classLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12)
    const intensityTrend = recentLogs.map((log) => ({
      date: log.date,
      intensity: log.intensity_level,
      duration: log.duration_minutes,
    }))

    // ─── Phase 5: Intensity Distribution ───
    const intensityDist: Record<Intensity, number> = { low: 0, medium: 0, high: 0 }
    classLogs.forEach((log) => { intensityDist[log.intensity_level]++ })

    // ─── Phase 5: Student Attendance ───
    const studentAttendance: Record<string, number> = {}
    classLogs.forEach((log) => {
      log.student_ids.forEach((sid) => {
        studentAttendance[sid] = (studentAttendance[sid] || 0) + 1
      })
    })
    const topAttendees = Object.entries(studentAttendance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => {
        const student = students.find((s) => s.id === id)
        return { name: student?.name || 'Unknown', belt: student?.belt_rank || 'white', count }
      })

    // ─── Phase 5: Stale Games (not played in 14+ days) ───
    const now = Date.now()
    const dayMs = 86400000
    const staleGames = games
      .filter((g) => {
        if (!g.last_played_at) return g.play_count === 0
        return (now - new Date(g.last_played_at).getTime()) / dayMs > 14
      })
      .sort((a, b) => {
        const aDate = a.last_played_at ? new Date(a.last_played_at).getTime() : 0
        const bDate = b.last_played_at ? new Date(b.last_played_at).getTime() : 0
        return aDate - bDate
      })
      .slice(0, 6)

    // ─── Phase 5: What Worked / What to Revisit ───
    const recentInsights = classLogs
      .filter((l) => l.what_worked || l.what_to_revisit)
      .slice(0, 5)

    // ─── Phase 5: Training Volume (classes per week, last 4 weeks) ───
    const fourWeeksAgo = new Date(now - 28 * dayMs)
    const recentClassLogs = classLogs.filter((l) => new Date(l.date) >= fourWeeksAgo)
    const weekBuckets: number[] = [0, 0, 0, 0]
    recentClassLogs.forEach((l) => {
      const weeksAgo = Math.floor((now - new Date(l.date).getTime()) / (7 * dayMs))
      if (weeksAgo < 4) weekBuckets[3 - weeksAgo]++
    })
    const totalTrainingMinutes = recentClassLogs.reduce((sum, l) => sum + l.duration_minutes, 0)

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
      // Phase 5
      totalClassLogs: classLogs.length,
      topTechniques,
      maxTechFreq,
      intensityTrend,
      intensityDist,
      topAttendees,
      staleGames,
      recentInsights,
      weekBuckets,
      totalTrainingMinutes,
      totalTechniques: techniques.length,
      totalStudents: students.length,
    }
  }, [games, classPreps, classLogs, techniques, students])

  const maxPositionCount = Math.max(...Object.values(analytics.positionCounts), 1)
  const maxPositionUsage = Math.max(...Object.values(analytics.positionUsage), 1)

  const statCards = [
    { label: 'Total Games', value: analytics.totalGames, icon: Target, color: 'text-primary' },
    { label: 'Sessions Planned', value: analytics.totalSessions, icon: BarChart3, color: 'text-accent' },
    { label: 'Classes Logged', value: analytics.totalClassLogs, icon: TrendingUp, color: 'text-success' },
    { label: 'Total Plays', value: analytics.totalPlayCount, icon: Flame, color: 'text-warning' },
    { label: 'Techniques', value: analytics.totalTechniques, icon: Zap, color: 'text-primary' },
    { label: 'Students', value: analytics.totalStudents, icon: Users, color: 'text-accent' },
    { label: 'Training (4wk)', value: `${analytics.totalTrainingMinutes}m`, icon: Clock, color: 'text-success' },
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
          Track your training patterns, technique usage, and coaching insights
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
              transition={{ delay: i * 0.05 }}
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

      {/* Training Volume (weekly bars) + Intensity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">Weekly Training Volume</h2>
          </div>
          <div className="flex items-end gap-3 h-32">
            {analytics.weekBuckets.map((count, i) => {
              const maxCount = Math.max(...analytics.weekBuckets, 1)
              const height = (count / maxCount) * 100
              const weekLabel = i === 3 ? 'This week' : i === 2 ? 'Last week' : `${3 - i}w ago`
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-foreground font-medium">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="w-full bg-gradient-to-t from-success to-success/50 rounded-t-lg min-h-[4px]"
                  />
                  <span className="text-[10px] text-muted-foreground">{weekLabel}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Intensity Distribution</h2>
          </div>
          {analytics.totalClassLogs === 0 ? (
            <p className="text-muted-foreground text-sm">No class logs yet</p>
          ) : (
            <div className="space-y-4">
              {(['low', 'medium', 'high'] as Intensity[]).map((level) => {
                const count = analytics.intensityDist[level]
                const pct = analytics.totalClassLogs > 0 ? Math.round((count / analytics.totalClassLogs) * 100) : 0
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${intensityColors[level]}`}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          level === 'high' ? 'bg-error' :
                          level === 'medium' ? 'bg-warning' :
                          'bg-success'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Technique Frequency Heatmap + Student Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Technique Frequency</h2>
          </div>
          {analytics.topTechniques.length === 0 ? (
            <p className="text-muted-foreground text-sm">No techniques drilled yet. Log classes to see data here.</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.topTechniques.map(([name, count], i) => {
                const pct = (count / analytics.maxTechFreq) * 100
                const hue = Math.round(200 - (i / analytics.topTechniques.length) * 140)
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-foreground truncate max-w-[70%]">{name}</span>
                      <span className="text-xs text-muted-foreground">{count}x</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: `hsl(${hue}, 70%, 55%)` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Student Attendance</h2>
          </div>
          {analytics.topAttendees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance data yet. Log classes with students.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topAttendees.map((attendee, i) => {
                const beltColors: Record<string, string> = {
                  white: 'bg-gray-200 text-gray-800',
                  blue: 'bg-blue-500 text-white',
                  purple: 'bg-purple-500 text-white',
                  brown: 'bg-amber-800 text-white',
                  black: 'bg-gray-900 text-white',
                }
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-foreground">{attendee.name}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${beltColors[attendee.belt] || ''}`}>
                          {attendee.belt}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">{attendee.count} classes</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Intensity Timeline */}
      {analytics.intensityTrend.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Intensity Timeline</h2>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {analytics.intensityTrend.map((entry, i) => {
              const intensityHeight: Record<Intensity, number> = { low: 33, medium: 66, high: 100 }
              const height = intensityHeight[entry.intensity]
              const color = entry.intensity === 'high' ? 'bg-error' :
                            entry.intensity === 'medium' ? 'bg-warning' : 'bg-success'
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${formatDate(entry.date)} — ${entry.intensity} (${entry.duration}m)`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className={`w-full ${color} rounded-t-sm min-h-[4px]`}
                  />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 justify-center">
            {(['low', 'medium', 'high'] as Intensity[]).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${level === 'high' ? 'bg-error' : level === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                <span className="text-xs text-muted-foreground capitalize">{level}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stale Games + Coaching Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Stale Games</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Games not played in 14+ days or never played</p>
          {analytics.staleGames.length === 0 ? (
            <p className="text-muted-foreground text-sm">All games are fresh!</p>
          ) : (
            <div className="space-y-2">
              {analytics.staleGames.map((game) => {
                const daysSince = game.last_played_at
                  ? Math.floor((Date.now() - new Date(game.last_played_at).getTime()) / 86400000)
                  : null
                return (
                  <div key={game.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">{game.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{positionLabels[game.position]}</span>
                    </div>
                    <span className="text-xs text-warning">
                      {daysSince !== null ? `${daysSince}d ago` : 'Never played'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Coaching Insights</h2>
          </div>
          {analytics.recentInsights.length === 0 ? (
            <p className="text-muted-foreground text-sm">Log classes with &quot;What Worked&quot; and &quot;What to Revisit&quot; to see insights here.</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentInsights.map((log) => (
                <div key={log.id} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground mb-1">{formatDate(log.date)}</p>
                  {log.what_worked && (
                    <p className="text-sm text-foreground">
                      <span className="text-success font-medium">Worked: </span>{log.what_worked}
                    </p>
                  )}
                  {log.what_to_revisit && (
                    <p className="text-sm text-foreground mt-0.5">
                      <span className="text-warning font-medium">Revisit: </span>{log.what_to_revisit}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
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
