'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { techniques } from '@/lib/seed/techniques'
import { games } from '@/lib/seed/games'
import { students } from '@/lib/seed/students'
import { sessions } from '@/lib/seed/sessions'
import { curricula } from '@/lib/seed/curricula'
import { classLogs } from '@/lib/seed/classLogs'

type LogEntry = { msg: string; type: 'info' | 'success' | 'error' }

export default function SeedPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)

  const log = (msg: string, type: LogEntry['type'] = 'info') =>
    setLogs((prev) => [...prev, { msg, type }])

  async function seedAll() {
    setRunning(true)
    setLogs([])
    const supabase = getSupabase()

    try {
      // ── 1. TECHNIQUES ──────────────────────────────────
      log('Seeding techniques...')
      const { data: techData, error: techErr } = await supabase
        .from('techniques')
        .insert(techniques)
        .select('id, name')

      if (techErr) throw new Error(`Techniques: ${techErr.message}`)
      log(`${techData.length} techniques seeded`, 'success')

      // Build a name-to-id map for linking
      const techMap = new Map(techData.map((t) => [t.name, t.id]))

      // ── 2. GAMES / DRILLS ──────────────────────────────
      log('Seeding games & drills...')
      const { data: gameData, error: gameErr } = await supabase
        .from('games')
        .insert(games)
        .select('id, name')

      if (gameErr) throw new Error(`Games: ${gameErr.message}`)
      log(`${gameData.length} games seeded`, 'success')

      const gameMap = new Map(gameData.map((g) => [g.name, g.id]))

      // ── 3. STUDENTS ────────────────────────────────────
      log('Seeding students...')
      const { data: studentData, error: studentErr } = await supabase
        .from('students')
        .insert(students)
        .select('id, name')

      if (studentErr) throw new Error(`Students: ${studentErr.message}`)
      log(`${studentData.length} students seeded`, 'success')

      const studentMap = new Map(studentData.map((s) => [s.name, s.id]))

      // ── 4. CLASS SESSIONS ──────────────────────────────
      log('Seeding class sessions...')

      // Assign some game_ids to sessions based on focus
      const gameNames = Array.from(gameMap.keys())
      const warmupIds = gameNames
        .filter((n) => {
          const g = games.find((gm) => gm.name === n)
          return g?.category === 'warmup'
        })
        .map((n) => gameMap.get(n)!)

      const cooldownIds = gameNames
        .filter((n) => {
          const g = games.find((gm) => gm.name === n)
          return g?.category === 'cooldown'
        })
        .map((n) => gameMap.get(n)!)

      const mainIds = gameNames
        .filter((n) => {
          const g = games.find((gm) => gm.name === n)
          return g?.category === 'main' || g?.category === 'positional'
        })
        .map((n) => gameMap.get(n)!)

      // Give each session a warmup, some main drills, and a cooldown
      const sessionsWithGames = sessions.map((s, i) => ({
        ...s,
        game_ids: [
          warmupIds[i % warmupIds.length],
          mainIds[i % mainIds.length],
          mainIds[(i + 1) % mainIds.length],
          cooldownIds[i % cooldownIds.length],
        ],
      }))

      const { data: sessionData, error: sessionErr } = await supabase
        .from('class_preps')
        .insert(sessionsWithGames)
        .select('id, name')

      if (sessionErr) throw new Error(`Sessions: ${sessionErr.message}`)
      log(`${sessionData.length} sessions seeded`, 'success')

      const sessionIds = sessionData.map((s) => s.id)

      // ── 5. CURRICULA ───────────────────────────────────
      log('Seeding curricula...')

      // Distribute sessions across curricula
      const giSessions = sessionIds.filter((_, i) => {
        const name = sessionData[i]?.name || ''
        return name.includes('Gi') || name.includes('gi')
      })
      const nogiSessions = sessionIds.filter((_, i) => {
        const name = sessionData[i]?.name || ''
        return name.includes('Nogi') || name.includes('nogi')
      })

      const curriculaWithSessions = curricula.map((c) => {
        let ids: string[] = []
        if (c.environment === 'gi') {
          ids = giSessions.slice(0, Math.min(giSessions.length, c.duration_weeks))
        } else if (c.environment === 'nogi') {
          ids = nogiSessions.slice(0, Math.min(nogiSessions.length, c.duration_weeks))
        } else {
          ids = sessionIds.slice(0, Math.min(sessionIds.length, c.duration_weeks))
        }
        return { ...c, session_ids: ids }
      })

      const { data: currData, error: currErr } = await supabase
        .from('curricula')
        .insert(curriculaWithSessions)
        .select('id, name')

      if (currErr) throw new Error(`Curricula: ${currErr.message}`)
      log(`${currData.length} curricula seeded`, 'success')

      // ── 6. CLASS LOGS ──────────────────────────────────
      log('Seeding class logs...')

      const studentIds = Array.from(studentMap.values())
      const logsWithIds = classLogs.map((cl, i) => ({
        ...cl,
        session_id: sessionIds[i % sessionIds.length],
        student_ids: studentIds.slice(0, 6 + (i % 4)), // vary attendance
      }))

      const { data: logData, error: logErr } = await supabase
        .from('class_logs')
        .insert(logsWithIds)
        .select('id')

      if (logErr) throw new Error(`Class Logs: ${logErr.message}`)
      log(`${logData.length} class logs seeded`, 'success')

      log('ALL DONE! Database fully seeded.', 'success')
    } catch (err) {
      log((err as Error).message, 'error')
    } finally {
      setRunning(false)
    }
  }

  async function clearAll() {
    setRunning(true)
    setLogs([])
    const supabase = getSupabase()

    const tables = ['class_logs', 'curricula', 'class_preps', 'students', 'games', 'techniques']
    for (const table of tables) {
      log(`Clearing ${table}...`)
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) {
        log(`Error clearing ${table}: ${error.message}`, 'error')
      } else {
        log(`${table} cleared`, 'success')
      }
    }
    setRunning(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'monospace', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Ecogram Database Seeder</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        Seeds the database with modern grappling curriculum: {techniques.length} techniques,{' '}
        {games.length} games, {students.length} students, {sessions.length} sessions,{' '}
        {curricula.length} curricula, {classLogs.length} class logs.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={seedAll}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#555' : '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          {running ? 'Running...' : 'Seed Everything'}
        </button>
        <button
          onClick={clearAll}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#555' : '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          {running ? 'Running...' : 'Clear All Data'}
        </button>
      </div>

      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 16,
          maxHeight: 500,
          overflowY: 'auto',
        }}
      >
        {logs.length === 0 && (
          <div style={{ color: '#666' }}>Click a button to start...</div>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              color:
                l.type === 'success'
                  ? '#22c55e'
                  : l.type === 'error'
                    ? '#ef4444'
                    : '#888',
              marginBottom: 4,
              fontSize: 14,
            }}
          >
            {l.type === 'success' ? '[OK]' : l.type === 'error' ? '[ERR]' : '[...]'}{' '}
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
