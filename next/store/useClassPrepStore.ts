'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ClassPrep, ClassPrepFilters, ClassPrepFormData,
  SmartBuilderConstraints, Game, ClassArcResult,
  Position,
} from '@/types/database'
import { getSupabase } from '@/lib/supabase'

// ─── Positional flow ordering ──────────────────────────
const FLOW_ORDER: Position[] = [
  'standing', 'clinch', 'turtle', 'guard', 'open-guard',
  'closed-guard', 'half-guard', 'side-control', 'mount', 'back', 'other',
]

const INTENSITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 }

function getPositionIndex(pos: Position): number {
  const idx = FLOW_ORDER.indexOf(pos)
  return idx === -1 ? FLOW_ORDER.length : idx
}

// ─── Smart shuffle that respects weighting ──────────────
function weightedShuffle(games: Game[], avoidRecentDays: number): Game[] {
  const now = Date.now()
  const dayMs = 86400000

  return [...games]
    .map((g) => {
      let weight = 1

      // Deprioritize recently played games
      if (avoidRecentDays > 0 && g.last_played_at) {
        const daysSincePlayed = (now - new Date(g.last_played_at).getTime()) / dayMs
        if (daysSincePlayed < avoidRecentDays) {
          weight *= 0.2
        } else {
          weight *= Math.min(2, daysSincePlayed / avoidRecentDays)
        }
      }

      // Deprioritize overplayed games slightly
      if (g.play_count > 10) weight *= 0.8
      if (g.play_count > 20) weight *= 0.6

      // Boost highly rated games slightly
      if (g.rating && g.rating >= 4) weight *= 1.3

      return { game: g, weight, random: Math.random() }
    })
    .sort((a, b) => b.weight * b.random - a.weight * a.random)
    .map((item) => item.game)
}

// ─── Sort by positional flow ────────────────────────────
function sortByPositionalFlow(games: Game[]): Game[] {
  return [...games].sort((a, b) => getPositionIndex(a.position) - getPositionIndex(b.position))
}

// ─── Sort by constraint escalation (CLA) ────────────────
function sortByConstraintEscalation(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    const aConstraints = a.rule_constraints?.length || 0
    const bConstraints = b.rule_constraints?.length || 0
    return aConstraints - bConstraints
  })
}

// ─── Calculate actual duration from games ───────────────
function sumDuration(games: Game[]): number {
  return games.reduce((sum, g) => sum + g.duration_minutes, 0)
}

// ─── Fit games to target duration ───────────────────────
function fitToDuration(games: Game[], targetMinutes: number): Game[] {
  const result: Game[] = []
  let remaining = targetMinutes
  for (const game of games) {
    if (game.duration_minutes <= remaining) {
      result.push(game)
      remaining -= game.duration_minutes
    }
    if (remaining <= 0) break
  }
  return result
}

interface ClassPrepState {
  classPreps: ClassPrep[]
  isLoading: boolean
  error: string | null
  filters: ClassPrepFilters

  fetchClassPreps: () => Promise<void>
  addClassPrep: (prep: ClassPrepFormData) => Promise<ClassPrep | null>
  updateClassPrep: (id: string, prep: Partial<ClassPrepFormData>) => Promise<void>
  deleteClassPrep: (id: string) => Promise<void>
  setFilters: (filters: Partial<ClassPrepFilters>) => void
  resetFilters: () => void

  generateSmartSession: (constraints: SmartBuilderConstraints, games: Game[]) => { warmup: Game[]; main: Game[]; cooldown: Game[] }
  generateClassArc: (constraints: SmartBuilderConstraints, games: Game[]) => ClassArcResult
}

const defaultFilters: ClassPrepFilters = {
  search: '',
  date_from: '',
  date_to: '',
  focus: '',
}

export const useClassPrepStore = create<ClassPrepState>()(
  persist(
    (set, get) => ({
      classPreps: [],
      isLoading: false,
      error: null,
      filters: defaultFilters,

      fetchClassPreps: async () => {
        const existing = get().classPreps
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_preps')
            .select('*')
            .order('date', { ascending: false })

          if (error) throw error
          set({ classPreps: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false, classPreps: existing })
        }
      },

      addClassPrep: async (prepData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_preps')
            .insert([prepData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            classPreps: [data, ...state.classPreps],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateClassPrep: async (id, prepData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('class_preps')
            .update(prepData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            classPreps: state.classPreps.map((p) =>
              p.id === id ? { ...p, ...prepData } : p
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteClassPrep: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('class_preps').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            classPreps: state.classPreps.filter((p) => p.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }))
      },

      resetFilters: () => {
        set({ filters: defaultFilters })
      },

      // ─── Phase 2: Intelligent Session Builder ─────────
      generateSmartSession: (constraints, games) => {
        let filtered = [...games]
        const avoidDays = constraints.avoid_recent_days || 0

        // Apply filters
        if (constraints.position) {
          filtered = filtered.filter((g) => g.position === constraints.position)
        }
        if (constraints.difficulty) {
          filtered = filtered.filter((g) => g.difficulty === constraints.difficulty)
        }
        if (constraints.topic) {
          filtered = filtered.filter((g) =>
            g.topic.toLowerCase().includes(constraints.topic!.toLowerCase())
          )
        }
        if (constraints.environment) {
          filtered = filtered.filter((g) =>
            g.environment_tags?.includes(constraints.environment!)
          )
        }
        if (constraints.intensity_target) {
          const targetRank = INTENSITY_RANK[constraints.intensity_target]
          filtered = filtered.filter((g) => {
            const gameRank = INTENSITY_RANK[g.intensity || 'medium']
            return Math.abs(gameRank - targetRank) <= 1
          })
        }

        // Separate by category
        const warmups = weightedShuffle(
          filtered.filter((g) => g.category === 'warmup'),
          avoidDays
        )
        const mains = weightedShuffle(
          filtered.filter((g) => g.category === 'main' || g.category === 'drill' || g.category === 'positional'),
          avoidDays
        )
        const cooldowns = weightedShuffle(
          filtered.filter((g) => g.category === 'cooldown'),
          avoidDays
        )

        let warmupResult: Game[]
        let mainResult: Game[]
        let cooldownResult: Game[]

        if (constraints.duration_minutes) {
          // Use ACTUAL durations instead of hardcoded 8-min average
          const targetDuration = constraints.duration_minutes
          const warmupBudget = Math.round(targetDuration * 0.15)
          const cooldownBudget = Math.round(targetDuration * 0.15)
          const mainBudget = targetDuration - warmupBudget - cooldownBudget

          warmupResult = fitToDuration(warmups, warmupBudget)
          mainResult = fitToDuration(mains, mainBudget)
          cooldownResult = fitToDuration(cooldowns, cooldownBudget)
        } else if (constraints.game_count) {
          const total = constraints.game_count
          const warmupCount = Math.max(1, Math.floor(total * 0.15))
          const cooldownCount = Math.max(1, Math.floor(total * 0.15))
          const mainCount = total - warmupCount - cooldownCount

          warmupResult = warmups.slice(0, warmupCount)
          mainResult = mains.slice(0, mainCount)
          cooldownResult = cooldowns.slice(0, cooldownCount)
        } else {
          warmupResult = warmups.slice(0, 1)
          mainResult = mains.slice(0, 3)
          cooldownResult = cooldowns.slice(0, 1)
        }

        // Apply positional flow if enabled
        if (constraints.positional_flow) {
          mainResult = sortByPositionalFlow(mainResult)
        }

        // Apply constraint escalation (CLA principle)
        mainResult = sortByConstraintEscalation(mainResult)

        return {
          warmup: warmupResult,
          main: mainResult,
          cooldown: cooldownResult,
        }
      },

      // ─── Phase 2: CLA Class Arc Generator ────────────
      generateClassArc: (constraints, games) => {
        let filtered = [...games]
        const avoidDays = constraints.avoid_recent_days || 0

        if (constraints.position) {
          filtered = filtered.filter((g) => g.position === constraints.position)
        }
        if (constraints.difficulty) {
          filtered = filtered.filter((g) => g.difficulty === constraints.difficulty)
        }
        if (constraints.environment) {
          filtered = filtered.filter((g) =>
            g.environment_tags?.includes(constraints.environment!)
          )
        }

        const targetDuration = constraints.duration_minutes || 60

        // CLA Class Arc:
        // 1. Movement Prep (10%) — low intensity warmups
        // 2. Technique Intro (20%) — drill category, low-medium intensity
        // 3. Guided Discovery (30%) — positional games with constraints (CLA core)
        // 4. Open Play (25%) — main games, higher intensity, fewer constraints
        // 5. Cool Down (15%) — cooldown category

        const movementPrepPool = weightedShuffle(
          filtered.filter((g) => g.category === 'warmup' && (g.intensity === 'low' || !g.intensity)),
          avoidDays
        )
        const techniqueIntroPool = weightedShuffle(
          filtered.filter((g) => g.category === 'drill' && g.intensity !== 'high'),
          avoidDays
        )
        const guidedDiscoveryPool = weightedShuffle(
          filtered.filter((g) =>
            g.category === 'positional' ||
            (g.category === 'main' && g.rule_constraints && g.rule_constraints.length > 0)
          ),
          avoidDays
        ).sort((a, b) => (b.rule_constraints?.length || 0) - (a.rule_constraints?.length || 0))

        const openPlayPool = weightedShuffle(
          filtered.filter((g) =>
            g.category === 'main' &&
            (g.intensity === 'medium' || g.intensity === 'high' || !g.intensity)
          ),
          avoidDays
        )
        const coolDownPool = weightedShuffle(
          filtered.filter((g) => g.category === 'cooldown'),
          avoidDays
        )

        const movement_prep = fitToDuration(movementPrepPool, Math.round(targetDuration * 0.10))
        const technique_intro = fitToDuration(techniqueIntroPool, Math.round(targetDuration * 0.20))
        const guided_discovery = fitToDuration(guidedDiscoveryPool, Math.round(targetDuration * 0.30))
        const open_play = fitToDuration(openPlayPool, Math.round(targetDuration * 0.25))
        const cool_down = fitToDuration(coolDownPool, Math.round(targetDuration * 0.15))

        const sortedDiscovery = constraints.positional_flow
          ? sortByPositionalFlow(guided_discovery)
          : guided_discovery

        return {
          movement_prep,
          technique_intro,
          guided_discovery: sortedDiscovery,
          open_play,
          cool_down,
          total_duration:
            sumDuration(movement_prep) +
            sumDuration(technique_intro) +
            sumDuration(sortedDiscovery) +
            sumDuration(open_play) +
            sumDuration(cool_down),
        }
      },
    }),
    {
      name: 'ecogram-class-preps',
      partialize: (state) => ({ classPreps: state.classPreps, filters: state.filters }),
    }
  )
)
