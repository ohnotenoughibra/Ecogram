'use client'

import { useState } from 'react'
import { useGameStore, useClassPrepStore, useTechniqueStore, useStudentStore, useCurriculumStore, useClassLogStore } from '@/store'
import { techniques as techSeed } from '@/lib/seed/techniques'
import { games as gameSeed } from '@/lib/seed/games'
import { students as studentSeed } from '@/lib/seed/students'
import { sessions as sessionSeed } from '@/lib/seed/sessions'
import { curricula as curriculaSeed } from '@/lib/seed/curricula'
import { classLogs as classLogSeed } from '@/lib/seed/classLogs'
import type { Game, Technique, Student, ClassPrep, Curriculum, ClassLog } from '@/types/database'

type LogEntry = { msg: string; type: 'info' | 'success' | 'error' }

function makeId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export default function SeedPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)

  const gameStore = useGameStore()
  const techStore = useTechniqueStore()
  const studentStore = useStudentStore()
  const classPrepStore = useClassPrepStore()
  const curriculumStore = useCurriculumStore()
  const classLogStore = useClassLogStore()

  const log = (msg: string, type: LogEntry['type'] = 'info') =>
    setLogs((prev) => [...prev, { msg, type }])

  function seedAll() {
    setRunning(true)
    setLogs([])

    try {
      const ts = now()

      // ── 1. TECHNIQUES ──────────────────────────────────
      log('Seeding techniques...')
      const seededTechniques: Technique[] = techSeed.map((t) => ({
        id: makeId(),
        name: t.name,
        position: t.position,
        category: t.category,
        gi_nogi: t.gi_nogi,
        belt_level_min: t.belt_level_min,
        belt_level_max: t.belt_level_max,
        prerequisite_ids: t.prerequisite_ids || [],
        description: t.description || null,
        video_url: t.video_url || null,
        tags: t.tags || [],
        created_at: ts,
        updated_at: ts,
      }))
      useTechniqueStore.setState({ techniques: seededTechniques, isLoading: false, error: null })
      log(`${seededTechniques.length} techniques seeded`, 'success')

      const techMap = new Map(seededTechniques.map((t) => [t.name, t.id]))

      // ── 2. GAMES / DRILLS ──────────────────────────────
      log('Seeding games & drills...')
      const seededGames: Game[] = gameSeed.map((g) => ({
        id: makeId(),
        name: g.name,
        description: g.description || null,
        position: g.position,
        topic: g.topic,
        difficulty: g.difficulty,
        category: g.category,
        duration_minutes: g.duration_minutes,
        techniques: g.techniques || [],
        variations: g.variations || [],
        is_favorite: false,
        play_count: 0,
        rating: null,
        video_url: null,
        environment_tags: g.environment_tags || [],
        intensity: g.intensity || 'medium',
        rule_constraints: g.rule_constraints || [],
        technique_ids: g.technique_ids || [],
        last_played_at: null,
        created_at: ts,
        updated_at: ts,
      }))
      useGameStore.setState({ games: seededGames, isLoading: false, error: null })
      log(`${seededGames.length} games seeded`, 'success')

      const gameMap = new Map(seededGames.map((g) => [g.name, g.id]))

      // ── 3. STUDENTS ────────────────────────────────────
      log('Seeding students...')
      const seededStudents: Student[] = studentSeed.map((s) => ({
        id: makeId(),
        name: s.name,
        belt_rank: s.belt_rank,
        stripes: s.stripes,
        start_date: s.start_date,
        competition_goals: s.competition_goals || null,
        strengths: s.strengths || [],
        weaknesses: s.weaknesses || [],
        injury_notes: s.injury_notes || null,
        notes: s.notes || null,
        environment_preference: s.environment_preference || null,
        created_at: ts,
        updated_at: ts,
      }))
      useStudentStore.setState({ students: seededStudents, isLoading: false, error: null })
      log(`${seededStudents.length} students seeded`, 'success')

      // ── 4. CLASS SESSIONS ──────────────────────────────
      log('Seeding class sessions...')

      // Assign game_ids based on category
      const warmupIds = seededGames
        .filter((g) => g.category === 'warmup')
        .map((g) => g.id)
      const cooldownIds = seededGames
        .filter((g) => g.category === 'cooldown')
        .map((g) => g.id)
      const mainIds = seededGames
        .filter((g) => g.category === 'main' || g.category === 'positional')
        .map((g) => g.id)

      const seededSessions: ClassPrep[] = sessionSeed.map((s, i) => ({
        id: makeId(),
        name: s.name,
        description: s.description || null,
        date: s.date,
        duration_minutes: s.duration_minutes || 90,
        focus: s.focus || null,
        skill_level: s.skill_level || null,
        game_ids: [
          warmupIds[i % Math.max(warmupIds.length, 1)],
          mainIds[i % Math.max(mainIds.length, 1)],
          mainIds[(i + 1) % Math.max(mainIds.length, 1)],
          cooldownIds[i % Math.max(cooldownIds.length, 1)],
        ].filter(Boolean),
        notes: s.notes || null,
        created_at: ts,
        updated_at: ts,
      }))
      useClassPrepStore.setState({ classPreps: seededSessions, isLoading: false, error: null })
      log(`${seededSessions.length} sessions seeded`, 'success')

      // ── 5. CURRICULA ───────────────────────────────────
      log('Seeding curricula...')

      const sessionIds = seededSessions.map((s) => s.id)
      const giSessionIds = seededSessions
        .filter((s) => s.name.toLowerCase().includes('gi') && !s.name.toLowerCase().includes('nogi'))
        .map((s) => s.id)
      const nogiSessionIds = seededSessions
        .filter((s) => s.name.toLowerCase().includes('nogi'))
        .map((s) => s.id)

      const seededCurricula: Curriculum[] = curriculaSeed.map((c) => {
        let ids: string[] = []
        if (c.environment === 'gi') {
          ids = giSessionIds.slice(0, Math.min(giSessionIds.length, c.duration_weeks))
        } else if (c.environment === 'nogi') {
          ids = nogiSessionIds.slice(0, Math.min(nogiSessionIds.length, c.duration_weeks))
        } else {
          ids = sessionIds.slice(0, Math.min(sessionIds.length, c.duration_weeks))
        }
        return {
          id: makeId(),
          name: c.name,
          description: c.description || null,
          duration_weeks: c.duration_weeks,
          goal: c.goal || null,
          target_belt_level: c.target_belt_level || null,
          environment: c.environment || null,
          session_ids: ids,
          progression_notes: c.progression_notes || null,
          created_at: ts,
          updated_at: ts,
        }
      })
      useCurriculumStore.setState({ curricula: seededCurricula, isLoading: false, error: null })
      log(`${seededCurricula.length} curricula seeded`, 'success')

      // ── 6. CLASS LOGS ──────────────────────────────────
      log('Seeding class logs...')

      const studentIds = seededStudents.map((s) => s.id)
      const seededLogs: ClassLog[] = classLogSeed.map((cl, i) => ({
        id: makeId(),
        session_id: sessionIds[i % Math.max(sessionIds.length, 1)] || null,
        date: cl.date,
        student_ids: studentIds.slice(0, 6 + (i % 4)),
        coach_notes: cl.coach_notes || null,
        techniques_drilled: cl.techniques_drilled || [],
        intensity_level: cl.intensity_level || 'medium',
        what_worked: cl.what_worked || null,
        what_to_revisit: cl.what_to_revisit || null,
        duration_minutes: cl.duration_minutes || 90,
        created_at: ts,
        updated_at: ts,
      }))
      useClassLogStore.setState({ classLogs: seededLogs, isLoading: false, error: null })
      log(`${seededLogs.length} class logs seeded`, 'success')

      log('ALL DONE! Data seeded into local stores. Navigate to any page to see it.', 'success')
    } catch (err) {
      log((err as Error).message, 'error')
    } finally {
      setRunning(false)
    }
  }

  function clearAll() {
    setRunning(true)
    setLogs([])

    try {
      log('Clearing techniques...')
      useTechniqueStore.setState({ techniques: [], isLoading: false, error: null })
      log('techniques cleared', 'success')

      log('Clearing games...')
      useGameStore.setState({ games: [], isLoading: false, error: null })
      log('games cleared', 'success')

      log('Clearing students...')
      useStudentStore.setState({ students: [], isLoading: false, error: null })
      log('students cleared', 'success')

      log('Clearing sessions...')
      useClassPrepStore.setState({ classPreps: [], isLoading: false, error: null })
      log('sessions cleared', 'success')

      log('Clearing curricula...')
      useCurriculumStore.setState({ curricula: [], isLoading: false, error: null })
      log('curricula cleared', 'success')

      log('Clearing class logs...')
      useClassLogStore.setState({ classLogs: [], isLoading: false, error: null })
      log('class logs cleared', 'success')

      log('ALL CLEARED! All local data removed.', 'success')
    } catch (err) {
      log((err as Error).message, 'error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'monospace', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Ecogram Database Seeder</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        Seeds local stores with modern grappling curriculum: {techSeed.length} techniques,{' '}
        {gameSeed.length} games, {studentSeed.length} students, {sessionSeed.length} sessions,{' '}
        {curriculaSeed.length} curricula, {classLogSeed.length} class logs.
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
