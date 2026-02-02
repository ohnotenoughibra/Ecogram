'use client'

import { useState, useRef } from 'react'
import { useGameStore } from '@/store'
import { Modal, ModalFooter, Button, Input, Select } from './ui'
import type { GameFormData, Position, Difficulty, GameCategory } from '@/types/database'

interface QuickAddProps {
  isOpen: boolean
  onClose: () => void
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
]

export function QuickAdd({ isOpen, onClose }: QuickAddProps) {
  const { addGame, isLoading } = useGameStore()
  const [mode, setMode] = useState<'quick' | 'voice' | 'photo'>('quick')
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [position, setPosition] = useState<Position>('guard')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [category, setCategory] = useState<GameCategory>('main')
  const [duration, setDuration] = useState(8)
  const [description, setDescription] = useState('')

  const resetForm = () => {
    setName('')
    setPosition('guard')
    setDifficulty('intermediate')
    setCategory('main')
    setDuration(8)
    setDescription('')
    setVoiceText('')
    setPhotoPreview(null)
    setMode('quick')
  }

  // Voice recognition
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
      setVoiceText(transcript)
      parseVoiceInput(transcript)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const parseVoiceInput = (text: string) => {
    const lower = text.toLowerCase()

    // Extract name (first part before any keywords)
    let extractedName = text

    // Position detection
    const positions: Record<string, Position> = {
      'guard': 'guard',
      'half guard': 'half-guard',
      'mount': 'mount',
      'side control': 'side-control',
      'back': 'back',
      'turtle': 'turtle',
      'standing': 'standing',
      'takedown': 'standing',
    }
    for (const [keyword, pos] of Object.entries(positions)) {
      if (lower.includes(keyword)) {
        setPosition(pos)
        extractedName = extractedName.replace(new RegExp(keyword, 'gi'), '').trim()
      }
    }

    // Difficulty detection
    if (lower.includes('beginner') || lower.includes('easy')) {
      setDifficulty('beginner')
      extractedName = extractedName.replace(/beginner|easy/gi, '').trim()
    } else if (lower.includes('advanced') || lower.includes('hard')) {
      setDifficulty('advanced')
      extractedName = extractedName.replace(/advanced|hard/gi, '').trim()
    } else if (lower.includes('intermediate')) {
      setDifficulty('intermediate')
      extractedName = extractedName.replace(/intermediate/gi, '').trim()
    }

    // Category detection
    if (lower.includes('warmup') || lower.includes('warm up')) {
      setCategory('warmup')
      extractedName = extractedName.replace(/warmup|warm up/gi, '').trim()
    } else if (lower.includes('cooldown') || lower.includes('cool down')) {
      setCategory('cooldown')
      extractedName = extractedName.replace(/cooldown|cool down/gi, '').trim()
    } else if (lower.includes('drill')) {
      setCategory('drill')
      extractedName = extractedName.replace(/drill/gi, '').trim()
    }

    // Duration detection
    const durationMatch = lower.match(/(\d+)\s*(?:min|minutes?)/)
    if (durationMatch) {
      setDuration(parseInt(durationMatch[1]))
      extractedName = extractedName.replace(/\d+\s*(?:min|minutes?)/gi, '').trim()
    }

    // Clean up name
    extractedName = extractedName.replace(/\s+/g, ' ').trim()
    if (extractedName) {
      // Capitalize first letter
      setName(extractedName.charAt(0).toUpperCase() + extractedName.slice(1))
    }
  }

  // Photo capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
      processPhoto(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const processPhoto = async (imageData: string) => {
    setIsProcessing(true)
    // In a real app, you'd send this to an AI API (GPT-4 Vision, Claude, etc.)
    // For now, we'll just show the preview and let user fill in details
    setTimeout(() => {
      setIsProcessing(false)
      // Could set some default values based on image analysis
      setName('New Game from Photo')
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return

    const gameData: GameFormData = {
      name: name.trim(),
      description: description || undefined,
      position,
      topic: position.charAt(0).toUpperCase() + position.slice(1).replace('-', ' '),
      difficulty,
      category,
      duration_minutes: duration,
      techniques: [],
      variations: [],
    }

    await addGame(gameData)
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Game" size="full">
      {/* Mode selector */}
      <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg">
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'quick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Quick
        </button>
        <button
          onClick={() => setMode('voice')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'voice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Voice
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'photo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Photo
        </button>
      </div>

      {/* Voice mode */}
      {mode === 'voice' && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <button
              onClick={startVoiceInput}
              disabled={isListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              {isListening ? 'Listening...' : 'Tap to speak'}
            </p>
          </div>

          {voiceText && (
            <div className="p-3 bg-secondary rounded-lg mb-4">
              <p className="text-sm text-secondary-foreground">"{voiceText}"</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Try: "Guard retention drill, beginner, 5 minutes"
          </p>
        </div>
      )}

      {/* Photo mode */}
      {mode === 'photo' && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Captured"
                className="w-full h-48 object-cover rounded-lg"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              <button
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
            >
              <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-muted-foreground">Take a photo of your whiteboard</span>
            </button>
          )}
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        <Input
          label="Game Name"
          placeholder="e.g., Guard Retention Flow"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Position"
            options={positionOptions}
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          />
          <Select
            label="Difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value as GameCategory)}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 8)}
          />
        </div>

        <Input
          label="Description (optional)"
          placeholder="Brief description of the game..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} loading={isLoading} disabled={!name.trim()}>
          Add Game
        </Button>
      </ModalFooter>
    </Modal>
  )
}
