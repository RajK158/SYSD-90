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
  'w-full bg-[#161b26] border border-[#1e2535] focus:border-purple-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors'

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
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-purple-400" />
              DSA Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Track your LeetCode journey — {solved.length}/150 NeetCode problems
              solved
            </p>
          </div>
          <button
            onClick={() => {
              setForm(emptyForm)
              setEditingId(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Problem
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-purple-400">
              {solved.length}
            </div>
            <div className="text-xs text-slate-500">Total Solved</div>
          </div>
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">{easy}</div>
            <div className="text-xs text-slate-500">Easy</div>
          </div>
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{medium}</div>
            <div className="text-xs text-slate-500">Medium</div>
          </div>
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{hard}</div>
            <div className="text-xs text-slate-500">Hard</div>
          </div>
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{toRevisit}</div>
            <div className="text-xs text-slate-500">To Revisit</div>
          </div>
        </div>

        {/* Progress bar toward 150 */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">
              NeetCode 150 Progress
            </span>
            <span className="text-sm font-bold text-purple-400">
              {Math.round((solved.length / 150) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((solved.length / 150) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{solved.length} solved</span>
            <span>150 target</span>
          </div>
        </div>

        {/* Topic breakdown */}
        {topicBreakdown.length > 0 && (
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Problems by Topic
            </h3>
            <div className="space-y-2">
              {topicBreakdown.map(({ topic, count }) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-40 flex-shrink-0 truncate">
                    {topic}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-400 w-4">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="bg-[#0f1117] border border-[#1e2535] text-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-purple-500 w-48 transition-colors"
            />
          </div>
          <FilterSelect
            value={filterTopic}
            onChange={setFilterTopic}
            options={['All', ...DSA_TOPICS]}
          />
          <FilterSelect
            value={filterDiff}
            onChange={setFilterDiff}
            options={['All', 'Easy', 'Medium', 'Hard']}
          />
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={['All', 'Solved', 'Attempted', 'To Revisit']}
          />
        </div>

        {/* Problems table */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl overflow-hidden">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">
                {editingId ? 'Edit Problem' : 'Log DSA Problem'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
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
                className="flex-1 bg-[#1e2535] hover:bg-[#2d3748] text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveProblem}
                disabled={!form.name || saving}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
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

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[#0f1117] border border-[#1e2535] text-slate-300 px-3 py-2 rounded-xl text-sm outline-none focus:border-purple-500 transition-colors"
    >
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  )
}
