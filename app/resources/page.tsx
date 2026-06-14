'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import { RESOURCES } from '@/lib/data/resources'
import { BookOpen, ExternalLink, StickyNote, Check } from 'lucide-react'
import type { ResourceCategory, ResourceStatus } from '@/lib/types'

const CATEGORIES: ResourceCategory[] = [
  'System Design Beginner',
  'System Design Intermediate',
  'DSA',
  'Mock Interviews',
  'Tools',
]

const STATUS_OPTIONS: ResourceStatus[] = ['Not Started', 'Using', 'Completed']

const STATUS_STYLE: Record<ResourceStatus, string> = {
  'Not Started': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Using': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const CAT_COLORS: Record<ResourceCategory, string> = {
  'System Design Beginner': 'text-blue-400',
  'System Design Intermediate': 'text-purple-400',
  'DSA': 'text-emerald-400',
  'Mock Interviews': 'text-cyan-400',
  'Tools': 'text-amber-400',
}

export default function ResourcesPage() {
  const supabase = createClient()
  const [statusMap, setStatusMap] = useState<Record<string, ResourceStatus>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStatuses() }, [])

  async function loadStatuses() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('resources_status').select('*').eq('user_id', user.id)
    if (data) {
      const sm: Record<string, ResourceStatus> = {}
      const nm: Record<string, string> = {}
      data.forEach(d => { sm[d.resource_key] = d.status; nm[d.resource_key] = d.notes ?? '' })
      setStatusMap(sm)
      setNotesMap(nm)
    }
    setLoading(false)
  }

  async function updateStatus(resourceKey: string, status: ResourceStatus) {
    setStatusMap(prev => ({ ...prev, [resourceKey]: status }))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('resources_status').upsert({
      user_id: user.id,
      resource_key: resourceKey,
      status,
      notes: notesMap[resourceKey] ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,resource_key' })
  }

  async function saveNote(resourceKey: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setNotesMap(prev => ({ ...prev, [resourceKey]: noteText }))
    await supabase.from('resources_status').upsert({
      user_id: user.id,
      resource_key: resourceKey,
      status: statusMap[resourceKey] ?? 'Not Started',
      notes: noteText,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,resource_key' })
    setEditingNote(null)
  }

  const filteredResources = activeCategory === 'All'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === activeCategory)

  const completedCount = Object.values(statusMap).filter(s => s === 'Completed').length
  const usingCount = Object.values(statusMap).filter(s => s === 'Using').length

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Resources
          </h1>
          <p className="text-slate-400 text-sm mt-1">{completedCount} completed · {usingCount} using · {RESOURCES.length} total resources</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#0f1117] border-[#1e2535] text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resources by category */}
        {(activeCategory === 'All' ? CATEGORIES : [activeCategory as ResourceCategory]).map(cat => {
          const catResources = filteredResources.filter(r => r.category === cat)
          if (catResources.length === 0) return null
          return (
            <div key={cat}>
              <h2 className={`text-sm font-bold mb-3 ${CAT_COLORS[cat as ResourceCategory]}`}>{cat}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {catResources.map(resource => {
                  const status = statusMap[resource.key] ?? 'Not Started'
                  const note = notesMap[resource.key] ?? ''
                  return (
                    <div key={resource.key} className="bg-[#0f1117] border border-[#1e2535] hover:border-[#2d3748] rounded-xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-white text-sm">{resource.name}</h3>
                        <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-slate-500 text-xs mb-3 leading-relaxed">{resource.description}</p>

                      {/* Status selector */}
                      <div className="flex gap-1.5 mb-2">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(resource.key, s)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                              status === s ? STATUS_STYLE[s] : 'bg-transparent text-slate-600 border-[#1e2535] hover:text-slate-400'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Note */}
                      {editingNote === resource.key ? (
                        <div className="mt-2">
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Add your notes..."
                            rows={2}
                            className="w-full bg-[#161b26] border border-[#1e2535] text-white rounded-lg px-3 py-2 text-xs outline-none resize-none"
                          />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => saveNote(resource.key)} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg">Save</button>
                            <button onClick={() => setEditingNote(null)} className="text-xs text-slate-500 px-3 py-1 rounded-lg">Cancel</button>
                          </div>
                        </div>
                      ) : note ? (
                        <p className="text-xs text-slate-500 mt-2 cursor-pointer hover:text-slate-400" onClick={() => { setEditingNote(resource.key); setNoteText(note) }}>{note}</p>
                      ) : (
                        <button onClick={() => { setEditingNote(resource.key); setNoteText('') }} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1 flex items-center gap-1 transition-colors">
                          <StickyNote className="w-3 h-3" /> Add note
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
