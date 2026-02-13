'use client'

import { useEffect, useState } from 'react'
import { useTechniqueStore } from '@/store'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, BookOpen, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst } from '@/lib/utils'
import type { Technique, TechniqueFormData, Position, TechniqueCategory, BeltLevel } from '@/types/database'

const positionOptions = [
  { value: '', label: 'All Positions' },
  { value: 'standing', label: 'Standing' },
  { value: 'clinch', label: 'Clinch' },
  { value: 'guard', label: 'Guard' },
  { value: 'open-guard', label: 'Open Guard' },
  { value: 'closed-guard', label: 'Closed Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'other', label: 'Other' },
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'sweep', label: 'Sweep' },
  { value: 'submission', label: 'Submission' },
  { value: 'pass', label: 'Pass' },
  { value: 'escape', label: 'Escape' },
  { value: 'control', label: 'Control' },
  { value: 'takedown', label: 'Takedown' },
  { value: 'guard-retention', label: 'Guard Retention' },
  { value: 'transition', label: 'Transition' },
  { value: 'throw', label: 'Throw' },
]

const giNogiOptions = [
  { value: '', label: 'All' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'both', label: 'Both' },
]

const beltOptions = [
  { value: '', label: 'All Belts' },
  { value: 'white', label: 'White' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
]

const beltColors: Record<string, string> = {
  white: 'bg-gray-200 text-gray-800',
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-gray-900 text-white',
}

const categoryColors: Record<string, string> = {
  sweep: 'success',
  submission: 'danger',
  pass: 'warning',
  escape: 'success',
  control: 'outline',
  takedown: 'warning',
  'guard-retention': 'success',
  transition: 'outline',
  throw: 'danger',
} as const

export default function TechniquesPage() {
  const { techniques, isLoading, fetchTechniques, addTechnique, updateTechnique, deleteTechnique, filteredTechniques, setFilters } = useTechniqueStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState<Technique | null>(null)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    fetchTechniques()
  }, [fetchTechniques])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setFilters({ search: value })
  }

  const handleEdit = (technique: Technique) => {
    setEditingTechnique(technique)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this technique?')) {
      await deleteTechnique(id)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTechnique(null)
  }

  const handleSave = async (data: TechniqueFormData) => {
    if (editingTechnique) {
      await updateTechnique(editingTechnique.id, data)
    } else {
      await addTechnique(data)
    }
    handleClose()
  }

  const filtered = filteredTechniques()

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Technique Library</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {techniques.length} techniques &middot; {filtered.length} shown
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Add Technique</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search techniques..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          onChange={(e) => setFilters({ position: e.target.value as Position | '' })}
          className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground"
        >
          {positionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          onChange={(e) => setFilters({ category: e.target.value as TechniqueCategory | '' })}
          className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground"
        >
          {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {isLoading && techniques.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No techniques found</h3>
          <p className="text-muted-foreground mb-6">
            {techniques.length === 0 ? 'Add your first technique to build your library' : 'Try adjusting your filters'}
          </p>
          {techniques.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Technique
            </Button>
          )}
        </motion.div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="card-grid">
          {filtered.map((tech, i) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className="group relative">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground">{capitalizeFirst(tech.position)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beltColors[tech.belt_level_min] || ''}`}>
                    {capitalizeFirst(tech.belt_level_min)}+
                  </span>
                </div>

                {tech.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tech.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={(categoryColors[tech.category] as 'success' | 'danger' | 'warning' | 'outline') || 'outline'}>
                    {capitalizeFirst(tech.category)}
                  </Badge>
                  <Badge variant="outline">
                    {tech.gi_nogi === 'both' ? 'Gi & No-Gi' : tech.gi_nogi === 'nogi' ? 'No-Gi' : 'Gi'}
                  </Badge>
                </div>

                {tech.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tech.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                    {tech.tags.length > 3 && <span className="text-xs text-muted-foreground">+{tech.tags.length - 3}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(tech)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(tech.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TechniqueModal
        isOpen={isModalOpen}
        onClose={handleClose}
        technique={editingTechnique}
        onSave={handleSave}
      />
    </div>
  )
}

function TechniqueModal({ isOpen, onClose, technique, onSave }: {
  isOpen: boolean
  onClose: () => void
  technique: Technique | null
  onSave: (data: TechniqueFormData) => void
}) {
  const [form, setForm] = useState<TechniqueFormData>({
    name: '',
    position: 'guard',
    category: 'sweep',
    gi_nogi: 'both',
    belt_level_min: 'white',
    belt_level_max: 'black',
    description: '',
    tags: [],
  })
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (technique) {
      setForm({
        name: technique.name,
        position: technique.position,
        category: technique.category,
        gi_nogi: technique.gi_nogi,
        belt_level_min: technique.belt_level_min,
        belt_level_max: technique.belt_level_max,
        description: technique.description || '',
        video_url: technique.video_url || '',
        tags: technique.tags,
      })
      setTagsInput(technique.tags.join(', '))
    } else {
      setForm({
        name: '',
        position: 'guard',
        category: 'sweep',
        gi_nogi: 'both',
        belt_level_min: 'white',
        belt_level_max: 'black',
        description: '',
        tags: [],
      })
      setTagsInput('')
    }
  }, [technique, isOpen])

  const handleTagsChange = (value: string) => {
    setTagsInput(value)
    setForm((f) => ({ ...f, tags: value.split(',').map((t) => t.trim()).filter(Boolean) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={technique ? 'Edit Technique' : 'Add Technique'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" placeholder="e.g., Scissor Sweep" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

        <Textarea label="Description" placeholder="How to perform this technique..." rows={3} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Position" options={positionOptions.filter((o) => o.value !== '')} value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as Position }))} />
          <Select label="Category" options={categoryOptions.filter((o) => o.value !== '')} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TechniqueCategory }))} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select label="Gi / No-Gi" options={giNogiOptions.filter((o) => o.value !== '')} value={form.gi_nogi} onChange={(e) => setForm((f) => ({ ...f, gi_nogi: e.target.value as 'gi' | 'nogi' | 'both' }))} />
          <Select label="Min Belt" options={beltOptions.filter((o) => o.value !== '')} value={form.belt_level_min} onChange={(e) => setForm((f) => ({ ...f, belt_level_min: e.target.value as BeltLevel }))} />
          <Select label="Max Belt" options={beltOptions.filter((o) => o.value !== '')} value={form.belt_level_max} onChange={(e) => setForm((f) => ({ ...f, belt_level_max: e.target.value as BeltLevel }))} />
        </div>

        <Input label="Tags" placeholder="sweep, guard, beginner (comma separated)" value={tagsInput} onChange={(e) => handleTagsChange(e.target.value)} hint={`${form.tags?.length || 0} tags`} />

        <Input label="Video URL" placeholder="https://youtube.com/..." value={form.video_url || ''} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{technique ? 'Update' : 'Add Technique'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
