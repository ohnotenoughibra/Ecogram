'use client'

import { useState } from 'react'
import { Button, Input, Modal, ModalFooter, Select } from '@/components/ui'
import { useGameStore } from '@/store'
import { AlertCircle, Video, Loader2 } from 'lucide-react'
import type { GameFormData, Position, Difficulty, GameCategory } from '@/types/database'

interface YouTubeImportProps {
  isOpen: boolean
  onClose: () => void
}

interface VideoInfo {
  title: string
  description: string
  videoId: string
  thumbnail: string
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Guess position from title/description
function guessPosition(text: string): Position {
  const lower = text.toLowerCase()
  if (lower.includes('guard') && !lower.includes('half')) return 'guard'
  if (lower.includes('half guard') || lower.includes('half-guard')) return 'half-guard'
  if (lower.includes('mount')) return 'mount'
  if (lower.includes('side control') || lower.includes('side-control')) return 'side-control'
  if (lower.includes('back') || lower.includes('rear')) return 'back'
  if (lower.includes('turtle')) return 'turtle'
  if (lower.includes('standing') || lower.includes('takedown')) return 'standing'
  return 'other'
}

// Guess difficulty from title/description
function guessDifficulty(text: string): Difficulty {
  const lower = text.toLowerCase()
  if (lower.includes('beginner') || lower.includes('basic') || lower.includes('fundamental')) return 'beginner'
  if (lower.includes('advanced') || lower.includes('expert')) return 'advanced'
  return 'intermediate'
}

// Guess category from title/description
function guessCategory(text: string): GameCategory {
  const lower = text.toLowerCase()
  if (lower.includes('warmup') || lower.includes('warm up') || lower.includes('warm-up')) return 'warmup'
  if (lower.includes('drill')) return 'drill'
  if (lower.includes('positional') || lower.includes('sparring')) return 'positional'
  if (lower.includes('flow') || lower.includes('cooldown') || lower.includes('cool down')) return 'cooldown'
  return 'main'
}

// Extract techniques from text
function extractTechniques(text: string): string[] {
  const techniques: string[] = []
  const keywords = [
    'armbar', 'arm bar', 'triangle', 'kimura', 'omoplata', 'guillotine',
    'rear naked choke', 'rnc', 'cross collar', 'americana', 'sweep',
    'pass', 'escape', 'submission', 'takedown', 'throw', 'leg lock',
    'heel hook', 'ankle lock', 'knee bar', 'mount escape', 'side escape',
    'hip escape', 'shrimp', 'bridge', 'underhook', 'overhook', 'collar tie'
  ]

  const lower = text.toLowerCase()
  keywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      const formatted = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      if (!techniques.includes(formatted)) {
        techniques.push(formatted)
      }
    }
  })

  return techniques.slice(0, 5)
}

const positionOptions = [
  { value: 'guard', label: 'Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'standing', label: 'Standing' },
  { value: 'other', label: 'Other' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const categoryOptions = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'main', label: 'Main' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'drill', label: 'Drill' },
  { value: 'positional', label: 'Positional' },
]

export function YouTubeImport({ isOpen, onClose }: YouTubeImportProps) {
  const { addGame } = useGameStore()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [gameData, setGameData] = useState<Partial<GameFormData>>({})

  const handleFetch = async () => {
    setError(null)
    setVideoInfo(null)

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('Invalid YouTube URL')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )

      if (!response.ok) {
        throw new Error('Could not fetch video info')
      }

      const data = await response.json()

      const info: VideoInfo = {
        title: data.title || '',
        description: '',
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      }

      setVideoInfo(info)

      const combinedText = info.title + ' ' + info.description
      setGameData({
        name: info.title.slice(0, 100),
        description: `Imported from YouTube video`,
        position: guessPosition(combinedText),
        difficulty: guessDifficulty(combinedText),
        category: guessCategory(combinedText),
        topic: 'Imported',
        duration_minutes: 10,
        techniques: extractTechniques(combinedText),
        variations: [],
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
      })
    } catch (err) {
      setError('Failed to fetch video information. Please check the URL.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!gameData.name) {
      setError('Please enter a game name')
      return
    }

    const fullGameData: GameFormData = {
      name: gameData.name || '',
      description: gameData.description,
      position: gameData.position || 'other',
      topic: gameData.topic || 'General',
      difficulty: gameData.difficulty || 'intermediate',
      category: gameData.category || 'main',
      duration_minutes: gameData.duration_minutes || 10,
      techniques: gameData.techniques || [],
      variations: gameData.variations || [],
      video_url: gameData.video_url,
    }

    setIsLoading(true)
    const result = await addGame(fullGameData)
    setIsLoading(false)

    if (result) {
      setUrl('')
      setVideoInfo(null)
      setGameData({})
      onClose()
    } else {
      setError('Failed to create game')
    }
  }

  const handleClose = () => {
    setUrl('')
    setVideoInfo(null)
    setGameData({})
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from YouTube">
      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            YouTube URL
          </label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1"
            />
            <Button onClick={handleFetch} disabled={isLoading || !url}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Fetch'
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error/20 text-error border border-error/30 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Video Preview */}
        {videoInfo && (
          <div className="border border-border/50 rounded-xl p-4 bg-background/50">
            <div className="flex gap-4">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{videoInfo.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  {videoInfo.videoId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Game Form (only shown after fetching) */}
        {videoInfo && gameData.name && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="font-medium text-foreground">Game Details</h3>

            <Input
              label="Name"
              value={gameData.name || ''}
              onChange={(e) => setGameData({ ...gameData, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Position"
                options={positionOptions}
                value={gameData.position || 'other'}
                onChange={(e) => setGameData({ ...gameData, position: e.target.value as Position })}
              />
              <Select
                label="Difficulty"
                options={difficultyOptions}
                value={gameData.difficulty || 'intermediate'}
                onChange={(e) => setGameData({ ...gameData, difficulty: e.target.value as Difficulty })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={gameData.category || 'main'}
                onChange={(e) => setGameData({ ...gameData, category: e.target.value as GameCategory })}
              />
              <Input
                label="Duration (min)"
                type="number"
                value={gameData.duration_minutes || 10}
                onChange={(e) => setGameData({ ...gameData, duration_minutes: parseInt(e.target.value) || 10 })}
                min={1}
                max={60}
              />
            </div>

            {gameData.techniques && gameData.techniques.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Detected Techniques
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {gameData.techniques.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} loading={isLoading}>
                Import Game
              </Button>
            </ModalFooter>
          </div>
        )}
      </div>
    </Modal>
  )
}
