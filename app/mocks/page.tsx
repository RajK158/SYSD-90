'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import { Mic2, Plus, X, Edit2, Trash2, Star } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { MockInterview, MockType } from '@/lib/types'

const SD_FRAMEWORK = [
  '1. Clarify requirements (functional + non-functional)',
  '2. Identify users and estimate scale (QPS, storage, bandwidth)',
  '3. Define APIs (REST endpoints, request/response)',
  '4. Define data model (schema, SQL vs NoSQL choice)',
  '5. Draw high-level architecture (all major components)',
  '6. Deep dive into hardest component',
  '7. Discuss trade-offs (choices made and why)',
  '8. Identify bottlenecks and solutions',
  '9. Add reliability, monitoring, and security',
  '10. 60-second final summary',
]

const emptyForm = {
  mock_type: 'System Design' as MockType,
  topic: '',
  date: new Date().toISOString().split('T')[0],
  duration_min: 45,
  score: 7,
  went_well: '',
  went_wrong: '',
  action_items: '',
  revisit_date: '',
}

export default function MocksPage() {
  const supabase = createClient()
  const [mocks, setMocks] = useState<MockInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showFramework, setShowFramework] = useState(true)

  useEffect(() => { loadMocks() }, [])

  async function loadMocks() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setMocks(data ?? [])
    setLoading(false)
  }

  async function saveMock() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      user_id: user.id,
      mock_type: form.mock_type,
      topic: form.topic,
      date: form.date,
      duration_min: form.duration_min,
      score: form.score,
      went_well: form.went_well || null,
      went_wrong: form.went_wrong || null,
      action_items: form.action_items || null,
      revisit_date: form.revisit_date || null,
    }

    if (editingId) {
      await supabase.from('mock_interviews').update(payload).eq('id', editingId)
    } else {
      await supabase.from('mock_interviews').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
    loadMocks()
  }

  async function deleteMock(id: string) {
    if (!confirm('Delete this mock interview record?')) return
    await supabase.from('mock_interviews').delete().eq('id', id)
    loadMocks()
  }

  function openEdit(m: MockInterview) {
    setForm({
      mock_type: m.mock_type,
      topic: m.topic,
      date: m.date,
      duration_min: m.duration_min,
      score: m.score,
      went_well: m.went_well ?? '',
      went_wrong: m.went_wrong ?? '',
      action_items: m.action_items ?? '',
      revisit_date: m.revisit_date ?? '',
    })
    setEditingId(m.id)
    setShowModal(true)
  }

  const avgScore = mocks.length > 0
    ? (mocks.reduce((acc, m) => acc + m.score, 0) / mocks.length).toFixed(1)
    : '—'

  const sdMocks = mocks.filter(m => m.mock_type === 'System Design')
  const dsaMocks = mocks.filter(m => m.mock_type === 'DSA')

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#F0EDED' }}>
                <Mic2 className="w-6 h-6" style={{ color: '#E8A838' }} />
                Mock Interviews
              </h1>
              <p className="text-sm mt-1" style={{ color: '#9A9494' }}>
                {mocks.length} mocks · Avg score: {avgScore}/10
              </p>
            </div>
            <button
              onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
              className="flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #E8A838, #D4761C)', color: '#0C0C0C', boxShadow: '0 4px 14px rgba(232,168,56,0.22)' }}
            >
              <Plus className="w-4 h-4" />
              Log Mock
            </button>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Mocks',   value: mocks.length,    color: '#E8A838' },
            { label: 'DSA Mocks',     value: dsaMocks.length, color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-4" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12 }}>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: '#5C5757' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* System Design Framework Reference Card */}
        <div className="overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(232,168,56,0.06), rgba(212,118,28,0.03))', border: '1px solid rgba(232,168,56,0.15)', borderRadius: 16 }}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => setShowFramework(!showFramework)}
          >
            <span className="font-bold text-sm" style={{ color: '#F0EDED' }}>📋 System Design Answer Framework</span>
            <span className="text-xs" style={{ color: '#9A9494' }}>{showFramework ? 'Hide' : 'Show'}</span>
          </button>
          {showFramework && (
            <div className="px-5 pb-4 grid sm:grid-cols-2 gap-2">
              {SD_FRAMEWORK.map(step => (
                <div key={step} className="flex items-start gap-2 text-xs" style={{ color: '#9A9494' }}>
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#E8A838' }}>▸</span>
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: '#5C5757' }}>Loading...</div>
        ) : mocks.length === 0 ? (
          <div className="text-center py-16">
            <Mic2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#3A3A3A' }} />
            <p className="font-medium" style={{ color: '#9A9494' }}>No mocks logged yet</p>
            <p className="text-sm mt-1" style={{ color: '#5C5757' }}>Start practicing and track your progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mocks.map(mock => (
              <div key={mock.id} className="p-5 group" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16 }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                        background: mock.mock_type === 'System Design' ? 'rgba(167,139,250,0.12)' : 'rgba(52,211,153,0.12)',
                        color: mock.mock_type === 'System Design' ? '#a78bfa' : '#34d399',
                      }}>
                        {mock.mock_type}
                      </span>
                      <span className="text-xs" style={{ color: '#5C5757' }}>{format(parseISO(mock.date), 'MMM d, yyyy')}</span>
                      <span className="text-xs" style={{ color: '#5C5757' }}>{mock.duration_min} min</span>
                    </div>
                    <h3 className="font-bold" style={{ color: '#F0EDED' }}>{mock.topic}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreStars score={mock.score} />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(mock)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#5C5757' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#E8A838'; e.currentTarget.style.background = 'rgba(232,168,56,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#5C5757'; e.currentTarget.style.background = 'transparent' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMock(mock.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#5C5757' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#5C5757'; e.currentTarget.style.background = 'transparent' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  {mock.went_well && (
                    <div>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#34d399' }}>✓ Went Well</div>
                      <p className="text-xs" style={{ color: '#9A9494' }}>{mock.went_well}</p>
                    </div>
                  )}
                  {mock.went_wrong && (
                    <div>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#f87171' }}>✗ Went Wrong</div>
                      <p className="text-xs" style={{ color: '#9A9494' }}>{mock.went_wrong}</p>
                    </div>
                  )}
                  {mock.action_items && (
                    <div>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#E8A838' }}>→ Action Items</div>
                      <p className="text-xs" style={{ color: '#9A9494' }}>{mock.action_items}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ color: '#F0EDED' }}>{editingId ? 'Edit Mock' : 'Log Mock Interview'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#5C5757' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F0EDED')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5C5757')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>Type</label>
                  <select value={form.mock_type} onChange={e => setForm({ ...form, mock_type: e.target.value as MockType })} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }}>
                    <option>System Design</option>
                    <option>DSA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>Topic / Problem</label>
                <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. URL Shortener, Two Sum" className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>Duration (min)</label>
                  <input type="number" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: Number(e.target.value) })} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>Score (0–10)</label>
                  <input type="number" min={0} max={10} value={form.score} onChange={e => setForm({ ...form, score: Number(e.target.value) })} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#34d399' }}>What Went Well</label>
                <textarea value={form.went_well} onChange={e => setForm({ ...form, went_well: e.target.value })} placeholder="Strengths to keep..." rows={2} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#f87171' }}>What Went Wrong</label>
                <textarea value={form.went_wrong} onChange={e => setForm({ ...form, went_wrong: e.target.value })} placeholder="Gaps to work on..." rows={2} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#E8A838' }}>Action Items</label>
                <textarea value={form.action_items} onChange={e => setForm({ ...form, action_items: e.target.value })} placeholder="What to study before next mock..." rows={2} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none" style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', color: '#F0EDED' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 font-medium py-2.5 rounded-xl text-sm" style={{ background: '#1F1F1F', color: '#9A9494' }}>Cancel</button>
              <button onClick={saveMock} disabled={!form.topic || saving} className="flex-1 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #E8A838, #D4761C)', color: '#0C0C0C' }}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save Mock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < score ? 'bg-amber-400' : 'bg-[#1e2535]'}`} />
      ))}
      <span className="text-xs font-bold text-amber-400 ml-1">{score}/10</span>
    </div>
  )
}
