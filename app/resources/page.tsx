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
  'Not Started': 'border border-[#2A2A2A] text-[#5C5757]',
  'Using': 'border border-amber-500/30 text-amber-400',
  'Completed': 'border border-emerald-500/30 text-emerald-400',
}

const STATUS_BG: Record<ResourceStatus, string> = {
  'Not Started': 'transparent',
  'Using': 'rgba(232,168,56,0.08)',
  'Completed': 'rgba(52,211,153,0.08)',
}

const CAT_COLORS: Record<ResourceCategory, string> = {
  'System Design Beginner': '#E8A838',
  'System Design Intermediate': '#a78bfa',
  'DSA': '#34d399',
  'Mock Interviews': '#60a5fa',
  'Tools': '#f87171',
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
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#F0EDED' }}>
            <BookOpen className="w-6 h-6" style={{ color: '#E8A838' }} />
            Resources
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9A9494' }}>{completedCount} completed · {usingCount} using · {RESOURCES.length} total resources</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
              style={{
                background: activeCategory === cat ? 'rgba(232,168,56,0.10)' : '#111111',
                borderColor: activeCategory === cat ? 'rgba(232,168,56,0.30)' : '#1F1F1F',
                color: activeCategory === cat ? '#E8A838' : '#9A9494',
              }}
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
              <h2 className="text-sm font-bold mb-3" style={{ color: CAT_COLORS[cat as ResourceCategory] }}>{cat}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {catResources.map(resource => {
                  const status = statusMap[resource.key] ?? 'Not Started'
                  const note = notesMap[resource.key] ?? ''
                  return (
                    <div key={resource.key} className="p-4 transition-all" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12 }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1F1F1F')}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-sm" style={{ color: '#F0EDED' }}>{resource.name}</h3>
                        <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 transition-colors" style={{ color: '#3A3A3A' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#E8A838')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: '#5C5757' }}>{resource.description}</p>

                      {/* Status selector */}
                      <div className="flex gap-1.5 mb-2">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(resource.key, s)}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all"
                            style={status === s ? { background: STATUS_BG[s] } : { background: 'transparent', borderColor: '#1F1F1F', color: '#5C5757' }}
                          >
                            <span className={status === s ? STATUS_STYLE[s] : ''}>{s}</span>
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
