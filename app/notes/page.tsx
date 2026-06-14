'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import { StickyNote, Plus, Search, X, Trash2, Edit2, Tag } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Note, NoteCategory } from '@/lib/types'

const CATEGORIES: NoteCategory[] = ['System Design', 'DSA', 'Mock Interview', 'Mistakes', 'Project Ideas', 'Revision']

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  'System Design': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'DSA': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Mock Interview': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Mistakes': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Project Ideas': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Revision': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const emptyForm = {
  title: '',
  category: 'System Design' as NoteCategory,
  week_number: '' as string | number,
  tags: '',
  content: '',
}

export default function NotesPage() {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }

  async function saveNote() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      user_id: user.id,
      title: form.title,
      category: form.category,
      week_number: form.week_number ? Number(form.week_number) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      content: form.content,
    }

    if (editingId) {
      await supabase.from('notes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId)
    } else {
      await supabase.from('notes').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
    loadNotes()
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', id)
    loadNotes()
  }

  function openEdit(note: Note) {
    setForm({
      title: note.title,
      category: note.category as NoteCategory,
      week_number: note.week_number ?? '',
      tags: note.tags?.join(', ') ?? '',
      content: note.content,
    })
    setEditingId(note.id)
    setShowModal(true)
  }

  const filtered = notes.filter(n => {
    if (activeCategory !== 'All' && n.category !== activeCategory) return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <StickyNote className="w-6 h-6 text-amber-400" />
              Notes
            </h1>
            <p className="text-slate-400 text-sm mt-1">{notes.length} notes across your 90-day journey</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="bg-[#0f1117] border border-[#1e2535] text-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-amber-500 w-48 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  activeCategory === cat
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-[#0f1117] border-[#1e2535] text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes grid */}
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <StickyNote className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No notes yet</p>
            <p className="text-slate-500 text-sm mt-1">Capture your learnings, mistakes, and insights</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(note => (
              <div key={note.id} className="bg-[#0f1117] border border-[#1e2535] hover:border-[#2d3748] rounded-2xl p-5 group card-hover">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[note.category as NoteCategory]}`}>
                    {note.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(note)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-white mb-2 line-clamp-2">{note.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-3 mb-3">{note.content}</p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-[#1e2535] text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span>{note.week_number ? `Week ${note.week_number}` : ''}</span>
                  <span>{format(parseISO(note.updated_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">{editingId ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Note title" className="w-full bg-[#161b26] border border-[#1e2535] focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as NoteCategory})} className="w-full bg-[#161b26] border border-[#1e2535] focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Week (optional)</label>
                  <input type="number" min={1} max={12} value={form.week_number} onChange={e => setForm({...form, week_number: e.target.value})} placeholder="1–12" className="w-full bg-[#161b26] border border-[#1e2535] focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. caching, redis, CDN" className="w-full bg-[#161b26] border border-[#1e2535] focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your notes, key concepts, mistakes, insights..." rows={8} className="w-full bg-[#161b26] border border-[#1e2535] focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-[#1e2535] hover:bg-[#2d3748] text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={saveNote} disabled={!form.title || saving} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
