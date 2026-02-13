'use client'

import { useState } from 'react'
import { useClassPrepStore, useClassLogStore, useTechniqueStore } from '@/store'
import { useToast } from '@/components/Toast'
import { Card, Badge, Button } from '@/components/ui'
import { formatDate, formatDuration, capitalizeFirst } from '@/lib/utils'
import { Printer, Share2, Edit, Trash2, Check, Clock, Dumbbell, ClipboardList, Zap, Link2 } from 'lucide-react'
import type { ClassPrep, Game } from '@/types/database'

interface ClassPrepCardProps {
  prep: ClassPrep
  games: Game[]
  onEdit: () => void
}

export function ClassPrepCard({ prep, games, onEdit }: ClassPrepCardProps) {
  const { deleteClassPrep } = useClassPrepStore()
  const { addClassLog } = useClassLogStore()
  const { techniques } = useTechniqueStore()
  const { confirm: confirmDialog, success: toastSuccess, error: toastError } = useToast()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [logCreated, setLogCreated] = useState(false)

  const prepGames = prep.game_ids
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean) as Game[]

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete Session',
      description: 'This class session and its game list will be removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (ok) {
      await deleteClassPrep(prep.id)
      toastSuccess('Session deleted')
    }
  }

  const totalDuration = prepGames.reduce((sum, g) => sum + g.duration_minutes, 0)

  // Collect unique environment tags and techniques from games
  const allEnvTags = [...new Set(prepGames.flatMap((g) => g.environment_tags || []))]
  const allIntensities = [...new Set(prepGames.map((g) => g.intensity).filter(Boolean))]
  const allTechniqueIds = [...new Set(prepGames.flatMap((g) => g.technique_ids || []))]
  const linkedTechniques = techniques.filter((t) => allTechniqueIds.includes(t.id))
  const allConstraintCount = prepGames.reduce((sum, g) => sum + (g.rule_constraints?.length || 0), 0)

  // Infer CLA arc phase from game categories
  const arcPhases = prepGames.map((g) => {
    if (g.category === 'warmup' && (g.intensity === 'low' || !g.intensity)) return 'Movement Prep'
    if (g.category === 'drill') return 'Technique Intro'
    if (g.category === 'positional' || (g.category === 'main' && g.rule_constraints?.length)) return 'Guided Discovery'
    if (g.category === 'main') return 'Open Play'
    if (g.category === 'cooldown') return 'Cool Down'
    return g.category
  })
  const uniquePhases = [...new Set(arcPhases)]

  const handleLogThisClass = async () => {
    const allTechNames = prepGames.flatMap((g) => g.techniques || [])
    await addClassLog({
      session_id: prep.id,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: totalDuration,
      intensity_level: allIntensities.length === 1 ? allIntensities[0]! : 'medium',
      techniques_drilled: [...new Set(allTechNames)],
      student_ids: [],
    })
    toastSuccess('Class logged', 'Check the Class Log page for details.')
  }

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${prep.name} - Class Plan</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .meta { color: #666; margin-bottom: 20px; }
            .game { padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px; }
            .game-header { display: flex; justify-content: space-between; align-items: center; }
            .game-name { font-weight: 600; font-size: 16px; }
            .game-meta { color: #666; font-size: 14px; margin-top: 4px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-yellow { background: #fef9c3; color: #854d0e; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .notes { background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${prep.name}</h1>
          <div class="meta">
            <strong>Date:</strong> ${formatDate(prep.date)} |
            <strong>Duration:</strong> ${formatDuration(totalDuration)} |
            <strong>Games:</strong> ${prepGames.length}
            ${prep.focus ? ` | <strong>Focus:</strong> ${prep.focus}` : ''}
            ${prep.skill_level ? ` | <strong>Level:</strong> ${capitalizeFirst(prep.skill_level)}` : ''}
          </div>
          ${prep.description ? `<p>${prep.description}</p>` : ''}

          <h2>Games</h2>
          ${prepGames.map((game, index) => `
            <div class="game">
              <div class="game-header">
                <span class="game-name">${index + 1}. ${game.name}</span>
                <span>${formatDuration(game.duration_minutes)}</span>
              </div>
              <div class="game-meta">
                <span class="badge ${game.difficulty === 'beginner' ? 'badge-green' : game.difficulty === 'intermediate' ? 'badge-yellow' : 'badge-red'}">${capitalizeFirst(game.difficulty)}</span>
                ${capitalizeFirst(game.position)} | ${capitalizeFirst(game.category)}
                ${game.environment_tags?.length ? ` | ${game.environment_tags.join(', ')}` : ''}
                ${game.intensity ? ` | Intensity: ${capitalizeFirst(game.intensity)}` : ''}
              </div>
              ${game.description ? `<p style="margin-top: 8px; color: #666;">${game.description}</p>` : ''}
              ${game.techniques.length > 0 ? `<p style="margin-top: 4px; font-size: 13px;"><strong>Techniques:</strong> ${game.techniques.join(', ')}</p>` : ''}
              ${game.rule_constraints?.length ? `<p style="margin-top: 4px; font-size: 13px;"><strong>Constraints:</strong> ${game.rule_constraints.map((c) => `${c.type}: ${c.description}`).join('; ')}</p>` : ''}
            </div>
          `).join('')}

          ${prep.notes ? `<div class="notes"><strong>Notes:</strong><br>${prep.notes}</div>` : ''}
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleShare = async () => {
    const shareData = {
      name: prep.name,
      date: prep.date,
      focus: prep.focus,
      skill_level: prep.skill_level,
      description: prep.description,
      notes: prep.notes,
      games: prepGames.map(g => ({
        name: g.name,
        position: g.position,
        difficulty: g.difficulty,
        category: g.category,
        duration_minutes: g.duration_minutes,
        techniques: g.techniques,
        description: g.description,
      }))
    }

    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)))
    const url = `${window.location.origin}/share?data=${encoded}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: prep.name,
          text: `Check out this BJJ class plan: ${prep.name}`,
          url: url,
        })
        return
      } catch {
        // Fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toastSuccess('Link copied', 'Share URL copied to clipboard.')
    } catch {
      toastError('Failed to copy link')
    }
  }

  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{prep.name}</h3>
            <Badge variant="outline">{formatDate(prep.date)}</Badge>
            {prep.skill_level && (
              <Badge
                variant={
                  prep.skill_level === 'beginner'
                    ? 'success'
                    : prep.skill_level === 'intermediate'
                    ? 'warning'
                    : 'danger'
                }
              >
                {prep.skill_level}
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              {prep.game_ids.length} games
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(totalDuration)}
            </span>
            {prep.focus && <span>Focus: {prep.focus}</span>}
          </div>

          {/* Environment & Intensity badges */}
          {(allEnvTags.length > 0 || allIntensities.length > 0 || allConstraintCount > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allEnvTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-secondary/50 border border-border/30 rounded-full text-xs text-muted-foreground">
                  {tag === 'nogi' ? 'No-Gi' : capitalizeFirst(tag)}
                </span>
              ))}
              {allIntensities.map((intensity) => (
                <span key={intensity} className={`px-2 py-0.5 rounded-full text-xs ${
                  intensity === 'high' ? 'bg-error/10 text-error border border-error/20' :
                  intensity === 'medium' ? 'bg-warning/10 text-warning border border-warning/20' :
                  'bg-success/10 text-success border border-success/20'
                }`}>
                  <Zap className="w-3 h-3 inline mr-0.5" />{capitalizeFirst(intensity!)}
                </span>
              ))}
              {allConstraintCount > 0 && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs">
                  {allConstraintCount} CLA constraint{allConstraintCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* CLA Arc Phases */}
          {uniquePhases.length > 1 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {uniquePhases.map((phase) => (
                <span key={phase} className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded text-xs text-primary">
                  {phase}
                </span>
              ))}
            </div>
          )}

          {/* Linked Techniques */}
          {linkedTechniques.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Link2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Linked Techniques</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {linkedTechniques.map((t) => (
                  <span key={t.id} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {prep.description && (
            <p className="text-sm text-muted-foreground mb-3">{prep.description}</p>
          )}

          {/* Games preview */}
          {prepGames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prepGames.map((game, index) => (
                <span
                  key={game.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-foreground"
                >
                  <span className="text-muted-foreground">{index + 1}.</span>
                  {game.name}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {prep.notes && (
            <p className="mt-3 text-sm text-muted-foreground italic">{prep.notes}</p>
          )}

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={handleLogThisClass} title="Log This Class">
            <ClipboardList className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handlePrint} title="Print">
            <Printer className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleShare} title="Share">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
