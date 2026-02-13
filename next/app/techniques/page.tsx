'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTechniqueStore } from '@/store'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, BookOpen, X, GitBranch, Link2 } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid')

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

      {/* View Mode Toggle + Filters */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-secondary/50 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            viewMode === 'grid'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Grid View
        </button>
        <button
          onClick={() => setViewMode('graph')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            viewMode === 'graph'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Prereq Graph
        </button>
      </div>

      {/* Filters (grid mode) */}
      {viewMode === 'grid' && (
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
      )}

      {/* Prerequisite Graph */}
      {viewMode === 'graph' && (
        <PrerequisiteGraph techniques={techniques} onEdit={handleEdit} />
      )}

      {/* Loading */}
      {viewMode === 'grid' && isLoading && techniques.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {viewMode === 'grid' && !isLoading && filtered.length === 0 && (
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
      {viewMode === 'grid' && filtered.length > 0 && (
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
  const { techniques: allTechniques } = useTechniqueStore()
  const [form, setForm] = useState<TechniqueFormData>({
    name: '',
    position: 'guard',
    category: 'sweep',
    gi_nogi: 'both',
    belt_level_min: 'white',
    belt_level_max: 'black',
    description: '',
    tags: [],
    prerequisite_ids: [],
  })
  const [tagsInput, setTagsInput] = useState('')
  const [prereqSearch, setPrereqSearch] = useState('')

  const availablePrereqs = allTechniques.filter((t) =>
    t.id !== technique?.id &&
    (prereqSearch
      ? t.name.toLowerCase().includes(prereqSearch.toLowerCase())
      : true)
  )

  const togglePrereq = (id: string) => {
    setForm((f) => {
      const ids = f.prerequisite_ids || []
      return {
        ...f,
        prerequisite_ids: ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id],
      }
    })
  }

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
        prerequisite_ids: technique.prerequisite_ids || [],
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
        prerequisite_ids: [],
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

        {/* Prerequisites */}
        {allTechniques.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Link2 className="w-3.5 h-3.5" />
                Prerequisites ({(form.prerequisite_ids || []).length})
              </label>
              <div className="relative w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  placeholder="Search..."
                  value={prereqSearch}
                  onChange={(e) => setPrereqSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-input border border-border/50 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 border border-border/50 rounded-xl p-2">
              {availablePrereqs.slice(0, 20).map((t) => {
                const selected = (form.prerequisite_ids || []).includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => togglePrereq(t.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selected
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground">{capitalizeFirst(t.category)}</span>
                  </button>
                )
              })}
              {availablePrereqs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No techniques found</p>
              )}
            </div>
          </div>
        )}

        <Input label="Video URL" placeholder="https://youtube.com/..." value={form.video_url || ''} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{technique ? 'Update' : 'Add Technique'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── Phase 6: Prerequisite Graph Visualization ───────────────────────

interface GraphNode {
  id: string
  name: string
  category: string
  belt: string
  x: number
  y: number
  depth: number
  children: string[]
  parents: string[]
}

function PrerequisiteGraph({ techniques, onEdit }: { techniques: Technique[]; onEdit: (t: Technique) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterBelt, setFilterBelt] = useState('')

  // Build adjacency from prerequisite_ids
  const { nodes, edges, layers } = useMemo(() => {
    // Find children (reverse of prerequisite_ids)
    const childMap: Record<string, string[]> = {}
    const parentMap: Record<string, string[]> = {}
    techniques.forEach((t) => {
      childMap[t.id] = []
      parentMap[t.id] = t.prerequisite_ids || []
    })
    techniques.forEach((t) => {
      (t.prerequisite_ids || []).forEach((pid) => {
        if (childMap[pid]) childMap[pid].push(t.id)
      })
    })

    // BFS to assign depth levels
    const depths: Record<string, number> = {}
    const roots = techniques.filter((t) => !t.prerequisite_ids?.length)
    const queue: { id: string; depth: number }[] = roots.map((r) => ({ id: r.id, depth: 0 }))
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id)) {
        depths[id] = Math.max(depths[id] || 0, depth)
        continue
      }
      visited.add(id)
      depths[id] = depth
      childMap[id]?.forEach((cid) => {
        queue.push({ id: cid, depth: depth + 1 })
      })
    }

    // Assign unvisited nodes (no prereqs and no children referencing them) to depth 0
    techniques.forEach((t) => {
      if (depths[t.id] === undefined) depths[t.id] = 0
    })

    // Group by depth
    const layerMap: Record<number, Technique[]> = {}
    techniques.forEach((t) => {
      const d = depths[t.id]
      if (!layerMap[d]) layerMap[d] = []
      layerMap[d].push(t)
    })

    const maxDepth = Math.max(...Object.keys(layerMap).map(Number), 0)
    const layerList = Array.from({ length: maxDepth + 1 }, (_, i) => layerMap[i] || [])

    // Position nodes
    const NODE_W = 180
    const NODE_H = 60
    const LAYER_GAP = 100
    const NODE_GAP = 20

    const graphNodes: Record<string, GraphNode> = {}
    layerList.forEach((layer, depth) => {
      const totalWidth = layer.length * NODE_W + (layer.length - 1) * NODE_GAP
      const startX = -totalWidth / 2
      layer.forEach((t, i) => {
        graphNodes[t.id] = {
          id: t.id,
          name: t.name,
          category: t.category,
          belt: t.belt_level_min,
          x: startX + i * (NODE_W + NODE_GAP) + NODE_W / 2,
          y: depth * (NODE_H + LAYER_GAP) + NODE_H / 2,
          depth,
          children: childMap[t.id] || [],
          parents: parentMap[t.id] || [],
        }
      })
    })

    // Build edges
    const edgeList: { from: string; to: string }[] = []
    techniques.forEach((t) => {
      (t.prerequisite_ids || []).forEach((pid) => {
        if (graphNodes[pid] && graphNodes[t.id]) {
          edgeList.push({ from: pid, to: t.id })
        }
      })
    })

    return { nodes: graphNodes, edges: edgeList, layers: layerList }
  }, [techniques])

  const filteredNodes = useMemo(() => {
    if (!filterBelt) return Object.values(nodes)
    const beltOrder = ['white', 'blue', 'purple', 'brown', 'black']
    const maxIdx = beltOrder.indexOf(filterBelt)
    return Object.values(nodes).filter((n) => beltOrder.indexOf(n.belt) <= maxIdx)
  }, [nodes, filterBelt])

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = edges.filter((e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to))

  // Compute viewBox
  const allX = filteredNodes.map((n) => n.x)
  const allY = filteredNodes.map((n) => n.y)
  const minX = Math.min(...allX, 0) - 120
  const maxX = Math.max(...allX, 0) + 120
  const minY = Math.min(...allY, 0) - 50
  const maxY = Math.max(...allY, 0) + 50
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`

  const selectedNode = selectedId ? nodes[selectedId] : null
  const selectedTech = selectedId ? techniques.find((t) => t.id === selectedId) : null

  const hasAnyEdges = edges.length > 0

  return (
    <div className="mb-8">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filterBelt}
          onChange={(e) => setFilterBelt(e.target.value)}
          className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Belt Levels</option>
          {beltOptions.filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value}>{o.label} & below</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {filteredNodes.length} techniques &middot; {filteredEdges.length} prerequisite links
        </span>
      </div>

      {!hasAnyEdges ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Prerequisites Set</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Edit techniques and link prerequisites to build a visual progression tree. The graph shows which techniques must be learned before others.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Graph */}
          <Card className="lg:col-span-2 overflow-auto">
            <svg
              viewBox={viewBox}
              className="w-full"
              style={{ minHeight: '400px', maxHeight: '600px' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    className="fill-muted-foreground/40"
                  />
                </marker>
              </defs>

              {/* Edges */}
              {filteredEdges.map((edge, i) => {
                const from = nodes[edge.from]
                const to = nodes[edge.to]
                if (!from || !to) return null
                const isHighlighted = selectedId === edge.from || selectedId === edge.to
                return (
                  <line
                    key={i}
                    x1={from.x}
                    y1={from.y + 20}
                    x2={to.x}
                    y2={to.y - 20}
                    className={`${isHighlighted ? 'stroke-primary' : 'stroke-muted-foreground/30'}`}
                    strokeWidth={isHighlighted ? 2 : 1}
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}

              {/* Nodes */}
              {filteredNodes.map((node) => {
                const isSelected = selectedId === node.id
                const isRelated = selectedNode && (selectedNode.children.includes(node.id) || selectedNode.parents.includes(node.id))
                const catColor = categoryColors[node.category] || 'outline'
                const fillClass = isSelected
                  ? 'fill-primary/20 stroke-primary'
                  : isRelated
                  ? 'fill-accent/10 stroke-accent'
                  : 'fill-card stroke-border/50'

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedId(isSelected ? null : node.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={node.x - 80}
                      y={node.y - 18}
                      width={160}
                      height={36}
                      rx={8}
                      className={fillClass}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={node.x}
                      y={node.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-[11px] font-medium ${isSelected ? 'fill-primary' : 'fill-foreground'}`}
                    >
                      {node.name.length > 20 ? node.name.slice(0, 18) + '...' : node.name}
                    </text>
                    {/* Belt dot */}
                    <circle
                      cx={node.x - 72}
                      cy={node.y}
                      r={4}
                      className={`${
                        node.belt === 'white' ? 'fill-gray-300' :
                        node.belt === 'blue' ? 'fill-blue-500' :
                        node.belt === 'purple' ? 'fill-purple-500' :
                        node.belt === 'brown' ? 'fill-amber-800' :
                        'fill-gray-900'
                      }`}
                    />
                  </g>
                )
              })}

              {/* Layer labels */}
              {layers.map((_, depth) => {
                const layerNodes = filteredNodes.filter((n) => n.depth === depth)
                if (layerNodes.length === 0) return null
                const y = layerNodes[0].y
                return (
                  <text
                    key={depth}
                    x={minX + 10}
                    y={y}
                    className="fill-muted-foreground/50 text-[10px]"
                    dominantBaseline="middle"
                  >
                    L{depth}
                  </text>
                )
              })}
            </svg>
          </Card>

          {/* Detail Panel */}
          <Card>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Details
            </h3>

            {!selectedTech ? (
              <p className="text-sm text-muted-foreground">Click a technique node to see details and its prerequisite chain.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground">{selectedTech.name}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant={(categoryColors[selectedTech.category] as 'success' | 'danger' | 'warning' | 'outline') || 'outline'}>
                      {capitalizeFirst(selectedTech.category)}
                    </Badge>
                    <Badge variant="outline">{capitalizeFirst(selectedTech.position)}</Badge>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beltColors[selectedTech.belt_level_min] || ''}`}>
                      {capitalizeFirst(selectedTech.belt_level_min)}+
                    </span>
                  </div>
                </div>

                {selectedTech.description && (
                  <p className="text-sm text-muted-foreground">{selectedTech.description}</p>
                )}

                {/* Prerequisites of selected */}
                {selectedTech.prerequisite_ids?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Requires</p>
                    <div className="space-y-1">
                      {selectedTech.prerequisite_ids.map((pid) => {
                        const prereq = techniques.find((t) => t.id === pid)
                        return prereq ? (
                          <button
                            key={pid}
                            onClick={() => setSelectedId(pid)}
                            className="w-full text-left px-3 py-1.5 bg-warning/5 border border-warning/20 rounded-lg text-sm text-foreground hover:bg-warning/10 transition-colors"
                          >
                            {prereq.name}
                          </button>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {/* What this unlocks */}
                {selectedNode && selectedNode.children.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Unlocks</p>
                    <div className="space-y-1">
                      {selectedNode.children.map((cid) => {
                        const child = techniques.find((t) => t.id === cid)
                        return child ? (
                          <button
                            key={cid}
                            onClick={() => setSelectedId(cid)}
                            className="w-full text-left px-3 py-1.5 bg-success/5 border border-success/20 rounded-lg text-sm text-foreground hover:bg-success/10 transition-colors"
                          >
                            {child.name}
                          </button>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                <Button size="sm" variant="secondary" onClick={() => onEdit(selectedTech)} className="w-full">
                  <Edit className="w-4 h-4 mr-1" /> Edit Technique
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
