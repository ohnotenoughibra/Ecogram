'use client'

import { useState } from 'react'
import { useClassPrepStore } from '@/store'
import { Card, Badge, Button } from '@/components/ui'
import { formatDate, formatDuration, capitalizeFirst } from '@/lib/utils'
import type { ClassPrep, Game } from '@/types/database'

interface ClassPrepCardProps {
  prep: ClassPrep
  games: Game[]
  onEdit: () => void
}

export function ClassPrepCard({ prep, games, onEdit }: ClassPrepCardProps) {
  const { deleteClassPrep } = useClassPrepStore()
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const prepGames = prep.game_ids
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean) as Game[]

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteClassPrep(prep.id)
    }
  }

  const totalDuration = prepGames.reduce((sum, g) => sum + g.duration_minutes, 0)

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
              </div>
              ${game.description ? `<p style="margin-top: 8px; color: #666;">${game.description}</p>` : ''}
              ${game.techniques.length > 0 ? `<p style="margin-top: 4px; font-size: 13px;"><strong>Techniques:</strong> ${game.techniques.join(', ')}</p>` : ''}
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
    // Create a shareable data object
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

    // Encode to base64
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)))
    const url = `${window.location.origin}/share?data=${encoded}`

    // Try native share first
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

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setShareUrl(url)
      setTimeout(() => setShareUrl(null), 3000)
    } catch {
      alert('Failed to copy link')
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
            <span>{prep.game_ids.length} games</span>
            <span>{formatDuration(totalDuration)}</span>
            {prep.focus && <span>Focus: {prep.focus}</span>}
          </div>

          {/* Description */}
          {prep.description && (
            <p className="text-sm text-muted-foreground mb-3">{prep.description}</p>
          )}

          {/* Games preview */}
          {prepGames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prepGames.map((game, index) => (
                <span
                  key={game.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm text-foreground"
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

          {/* Share URL notification */}
          {shareUrl && (
            <div className="mt-3 p-2 bg-green-500/20 text-green-700 dark:text-green-400 rounded text-sm">
              Link copied to clipboard!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={handlePrint} title="Print">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleShare} title="Share">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
