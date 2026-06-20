'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import {
  DSA_TOPICS,
  DSA_PLATFORMS,
  type DSATopic,
  type DSAPlatform,
  type DifficultyLevel,
  type ProblemStatus,
  type DSAProblem,
} from '@/lib/types'
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  Easy: 'diff-easy',
  Medium: 'diff-medium',
  Hard: 'diff-hard',
}

const STATUS_COLORS: Record<ProblemStatus, string> = {
  Solved: 'status-completed',
  Attempted: 'status-in-progress',
  'To Revisit': 'bg-amber-500/10 text-amber-400',
}

const emptyForm = {
  name: '',
  platform: 'LeetCode' as DSAPlatform,
  topic: 'Arrays and Hashing' as DSATopic,
  difficulty: 'Medium' as DifficultyLevel,
  status: 'Solved' as ProblemStatus,
  date_solved: new Date().toISOString().split('T')[0],
  mistake_note: '',
  revisit_date: '',
  link: '',
}

const INPUT_CLASS =
  'w-full text-sm text-[#F0EDED] outline-none transition-colors'

const inputStyle = {
  background: '#0C0C0C',
  border: '1px solid #2A2A2A',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#F0EDED',
} as const

export default function DSAPage() {
  const supabase = createClient()
  const [problems, setProblems] = useState<DSAProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [filterTopic, setFilterTopic] = useState<string>('All')
  const [filterDiff, setFilterDiff] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProblems()
  }, [])

  async function loadProblems() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('dsa_problems')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProblems(data ?? [])
    setLoading(false)
  }

  async function saveProblem() {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      user_id: user.id,
      date_solved: form.date_solved || null,
      revisit_date: form.revisit_date || null,
      mistake_note: form.mistake_note || null,
      link: form.link || null,
    }

    if (editingId) {
      await supabase.from('dsa_problems').update(payload).eq('id', editingId)
    } else {
      await supabase.from('dsa_problems').insert(payload)
    }

    setSaving(false)
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
    loadProblems()
  }

  async function deleteProblem(id: string) {
    if (!confirm('Delete this problem?')) return
    await supabase.from('dsa_problems').delete().eq('id', id)
    loadProblems()
  }

  function openEdit(p: DSAProblem) {
    setForm({
      name: p.name,
      platform: p.platform as DSAPlatform,
      topic: p.topic as DSATopic,
      difficulty: p.difficulty as DifficultyLevel,
      status: p.status as ProblemStatus,
      date_solved: p.date_solved ?? '',
      mistake_note: p.mistake_note ?? '',
      revisit_date: p.revisit_date ?? '',
      link: p.link ?? '',
    })
    setEditingId(p.id)
    setShowModal(true)
  }

  const filtered = problems.filter(p => {
    if (filterTopic !== 'All' && p.topic !== filterTopic) return false
    if (filterDiff !== 'All' && p.difficulty !== filterDiff) return false
    if (filterStatus !== 'All' && p.status !== filterStatus) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  // Stats
  const solved = problems.filter(p => p.status === 'Solved')
  const easy = solved.filter(p => p.difficulty === 'Easy').length
  const medium = solved.filter(p => p.difficulty === 'Medium').length
  const hard = solved.filter(p => p.difficulty === 'Hard').length
  const toRevisit = problems.filter(p => p.status === 'To Revisit').length

  // Topic breakdown
  const topicBreakdown = DSA_TOPICS.map(t => ({
    topic: t,
    count: solved.filter(p => p.topic === t).length,
  }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#F0EDED' }}>
              <Code2 className="w-6 h-6" style={{ color: '#E8A838' }} />
              DSA Tracker
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9A9494' }}>
              Track your LeetCode journey — {solved.length}/150 NeetCode problems solved
            </p>
          </div>
          <button
            onClick={() => {
              setForm(emptyForm)
              setEditingId(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #E8A838, #D4761C)', color: '#0C0C0C', boxShadow: '0 4px 14px rgba(232,168,56,0.22)' }}
          >
            <Plus className="w-4 h-4" />
            Log Problem
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Solved', value: solved.length, color: '#E8A838' },
            { label: 'Easy',         value: easy,          color: '#34d399' },
            { label: 'Medium',       value: medium,        color: '#f59e0b' },
            { label: 'Hard',         value: hard,          color: '#ef4444' },
            { label: 'To Revisit',   value: toRevisit,     color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-4" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12 }}>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: '#5C5757' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar toward 150 */}
        <div className="p-4" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: '#9A9494' }}>NeetCode 150 Progress</span>
            <span className="text-sm font-bold" style={{ color: '#E8A838' }}>{Math.round((solved.length / 150) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1F1F1F' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((solved.length / 150) * 100, 100)}%`, background: 'linear-gradient(90deg, #E8A838, #D4761C)' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: '#5C5757' }}>
            <span>{solved.length} solved</span>
            <span>150 target</span>
          </div>
        </div>

        {/* Topic breakdown */}
        {topicBreakdown.length > 0 && (
          <div className="p-4" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12 }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#9A9494' }}>Problems by Topic</h3>
            <div className="space-y-2">
              {topicBreakdown.map(({ topic, count }) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-xs w-40 flex-shrink-0 truncate" style={{ color: '#9A9494' }}>{topic}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1F1F1F' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((count / 10) * 100, 100)}%`, background: '#E8A838' }} />
                  </div>
                  <span className="text-xs font-bold w-4" style={{ color: '#E8A838' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5C5757' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-48 transition-colors"
              style={{ background: '#111111', border: '1px solid #1F1F1F', color: '#F0EDED' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,168,56,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1F1F1F')}
            />
          </div>
          <FilterSelect value={filterTopic}  onChange={setFilterTopic}  options={['All', ...DSA_TOPICS]} />
          <FilterSelect value={filterDiff}   onChange={setFilterDiff}   options={['All', 'Easy', 'Medium', 'Hard']} />
          <FilterSelect value={filterStatus} onChange={setFilterStatus} options={['All', 'Solved', 'Attempted', 'To Revisit']} />
        </div>

        {/* Problems table */}
        <div className="overflow-hidden" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16 }}>
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Code2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No problems yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Start logging your LeetCode problems
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2535]">
                    {[
                      'Problem',
                      'Platform',
                      'Topic',
                      'Difficulty',
                      'Status',
                      'Date',
                      'Actions',
                    ].map(h => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2535]">
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#161b26] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {p.name}
                          </span>
                          {p.link && (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-600 hover:text-blue-400 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {p.mistake_note && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                            {p.mistake_note}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {p.platform}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-[#1e2535] text-slate-300 px-2 py-0.5 rounded-md">
                          {p.topic}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`tag ${DIFFICULTY_COLORS[p.difficulty as DifficultyLevel]}`}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`tag ${STATUS_COLORS[p.status as ProblemStatus]}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {p.date_solved
                          ? format(parseISO(p.date_solved), 'MMM d')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProblem(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ color: '#F0EDED' }}>{editingId ? 'Edit Problem' : 'Log DSA Problem'}</h3>
              <button onClick={() => setShowModal(false)} className="transition-colors" style={{ color: '#5C5757' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F0EDED')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5C5757')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Problem Name */}
              <FormField label="Problem Name">
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Two Sum"
                  className={INPUT_CLASS}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,168,56,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
                />
              </FormField>

              {/* Platform + Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Platform">
                  <select
                    value={form.platform}
                    onChange={e =>
                      setForm({ ...form, platform: e.target.value as DSAPlatform })
                    }
                    className={INPUT_CLASS}
                  >
                    {DSA_PLATFORMS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Difficulty">
                  <select
                    value={form.difficulty}
                    onChange={e =>
                      setForm({
                        ...form,
                        difficulty: e.target.value as DifficultyLevel,
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Topic */}
              <FormField label="Topic">
                <select
                  value={form.topic}
                  onChange={e =>
                    setForm({ ...form, topic: e.target.value as DSATopic })
                  }
                  className={INPUT_CLASS}
                >
                  {DSA_TOPICS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Status + Date Solved */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={e =>
                      setForm({ ...form, status: e.target.value as ProblemStatus })
                    }
                    className={INPUT_CLASS}
                  >
                    {['Solved', 'Attempted', 'To Revisit'].map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Date Solved">
                  <input
                    type="date"
                    value={form.date_solved}
                    onChange={e =>
                      setForm({ ...form, date_solved: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>

              {/* Problem Link */}
              <FormField label="Problem Link (optional)">
                <input
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  placeholder="https://leetcode.com/problems/..."
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Mistake Note */}
              <FormField label="Mistake Note (optional)">
                <textarea
                  value={form.mistake_note}
                  onChange={e =>
                    setForm({ ...form, mistake_note: e.target.value })
                  }
                  placeholder="What did you get wrong? What pattern did you miss?"
                  className={`${INPUT_CLASS} h-20 resize-none`}
                />
              </FormField>

              {/* Revisit Date */}
              <FormField label="Revisit Date (optional)">
                <input
                  type="date"
                  value={form.revisit_date}
                  onChange={e =>
                    setForm({ ...form, revisit_date: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 font-medium py-2.5 rounded-xl transition-colors text-sm"
                style={{ background: '#1F1F1F', color: '#9A9494' }}
              >
                Cancel
              </button>
              <button
                onClick={saveProblem}
                disabled={!form.name || saving}
                className="flex-1 font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #E8A838, #D4761C)', color: '#0C0C0C', boxShadow: '0 4px 14px rgba(232,168,56,0.22)' }}
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save Problem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl text-sm outline-none transition-colors"
      style={{ background: '#111111', border: '1px solid #1F1F1F', color: '#9A9494' }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9A9494' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
