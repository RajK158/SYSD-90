'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import { generateDailyTasks } from '@/lib/data/roadmap'
import { getCurrentDay } from '@/lib/utils/date'
import { Calendar, CheckCircle2, Circle, ChevronRight, Search, Filter, StickyNote, X, Plus, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ALL_DAYS = generateDailyTasks()
const TASK_TYPES = ['system_design', 'dsa', 'practical', 'revision'] as const
type FilterType = 'all' | 'completed' | 'incomplete' | 'today'

const TASK_TYPE_LABELS: Record<string, string> = {
  system_design: '🏗️ System Design',
  dsa: '💻 DSA',
  practical: '🔨 Practical',
  revision: '📚 Revision',
}

export default function DailyTasksPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const currentDay = getCurrentDay(profile?.start_date ?? null)
  const todayRef = useRef<HTMLDivElement>(null)

  const [completions, setCompletions] = useState<Record<string, Record<string, boolean>>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const [editingTask, setEditingTask] = useState<{ day: number; type: string } | null>(null)
  const [taskText, setTaskText] = useState('')

  useEffect(() => { loadCompletions() }, [])
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading])

  async function loadCompletions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('task_completions')
      .select('day_number, task_type, completed, notes')
      .eq('user_id', user.id)
      .not('task_type', 'eq', 'revision') // Load all except roadmap revisions
      .order('day_number')

    if (data) {
      const comp: Record<string, Record<string, boolean>> = {}
      const noteMap: Record<number, string> = {}
      data.forEach(d => {
        if (!comp[d.day_number]) comp[d.day_number] = {}
        comp[d.day_number][d.task_type] = d.completed
        if (d.notes && !noteMap[d.day_number]) noteMap[d.day_number] = d.notes
      })
      setCompletions(comp)
      setNotes(noteMap)
    }
    setLoading(false)
  }

  async function toggleTask(day: number, taskType: string) {
    const current = completions[day]?.[taskType]
    const newVal = !current

    setCompletions(prev => ({
      ...prev,
      [day]: { ...(prev[day] ?? {}), [taskType]: newVal },
    }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('task_completions').upsert({
      user_id: user.id,
      day_number: day,
      task_type: taskType,
      task_key: taskType,
      completed: newVal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,day_number,task_type,task_key' })
  }

  async function saveNote(day: number) {
    setNotes(prev => ({ ...prev, [day]: noteText }))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('task_completions').upsert({
      user_id: user.id,
      day_number: day,
      task_type: 'system_design',
      task_key: 'system_design',
      completed: completions[day]?.system_design ?? false,
      notes: noteText,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,day_number,task_type,task_key' })

    setEditingNote(null)
  }

  function getDayProgress(day: number) {
    const dayComp = completions[day] ?? {}
    const done = TASK_TYPES.filter(t => dayComp[t]).length
    return { done, total: TASK_TYPES.length, pct: Math.round((done / TASK_TYPES.length) * 100) }
  }

  function getDayStatus(day: number): 'completed' | 'in_progress' | 'not_started' | 'future' {
    if (day > currentDay) return 'future'
    const prog = getDayProgress(day)
    if (prog.pct === 100) return 'completed'
    if (prog.pct > 0) return 'in_progress'
    return 'not_started'
  }

  function getDayTask(dayData: ReturnType<typeof generateDailyTasks>[0], type: string) {
    switch (type) {
      case 'system_design': return dayData.systemDesignTask
      case 'dsa': return dayData.dsaTask
      case 'practical': return dayData.practicalTask
      case 'revision': return dayData.revisionTask
      default: return ''
    }
  }

  const filteredDays = ALL_DAYS.filter(day => {
    if (filter === 'today') return day.day === currentDay
    if (filter === 'completed') return getDayStatus(day.day) === 'completed'
    if (filter === 'incomplete') return ['not_started', 'in_progress'].includes(getDayStatus(day.day)) && day.day <= currentDay
    if (search) {
      const q = search.toLowerCase()
      return day.systemDesignTask.toLowerCase().includes(q) ||
        day.dsaTask.toLowerCase().includes(q)
    }
    return true
  })

  const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
    completed: { label: 'Completed', cls: 'status-completed' },
    in_progress: { label: 'In Progress', cls: 'status-in-progress' },
    not_started: { label: 'Not Started', cls: 'status-not-started' },
    future: { label: 'Upcoming', cls: 'bg-[#1e2535] text-slate-500' },
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Daily Tasks
            </h1>
            <p className="text-slate-400 text-sm mt-1">All 90 days · Currently on Day {currentDay}</p>
          </div>
          <button
            onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
          >
            Jump to Today <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-[#0f1117] border border-[#1e2535] text-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-500 w-48 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'today', 'incomplete', 'completed'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all capitalize',
                  filter === f
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                    : 'bg-[#0f1117] border-[#1e2535] text-slate-400 hover:text-slate-200'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Days list */}
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading your 90 days...</div>
        ) : (
          <div className="space-y-3">
            {filteredDays.map(dayData => {
              const status = getDayStatus(dayData.day)
              const progress = getDayProgress(dayData.day)
              const isToday = dayData.day === currentDay
              const isFuture = status === 'future'
              const badge = STATUS_BADGES[status]
              const dayNote = notes[dayData.day]

              return (
                <div
                  key={dayData.day}
                  ref={isToday ? todayRef : undefined}
                  className={cn(
                    'bg-[#0f1117] border rounded-2xl overflow-hidden transition-all',
                    isToday ? 'border-blue-500/50 shadow-lg shadow-blue-500/5' : 'border-[#1e2535]',
                    isFuture ? 'opacity-60' : ''
                  )}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Day number */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0',
                      isToday ? 'bg-blue-600 text-white' :
                      status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-[#1e2535] text-slate-400'
                    )}>
                      {dayData.day}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">Week {dayData.week} · {dayData.dayOfWeek}</span>
                        {isToday && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">TODAY</span>}
                        <span className={`tag ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-sm text-slate-300 truncate">{dayData.systemDesignTask}</p>
                    </div>

                    {/* Progress */}
                    {!isFuture && (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block">
                          <div className="w-20 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress.pct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 text-right">{progress.done}/{progress.total}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task checkboxes — only show for current and past days */}
                  {!isFuture && (
                    <div className="px-5 pb-4 border-t border-[#1e2535] pt-4 space-y-2">
                      {TASK_TYPES.map(type => {
                        const done = completions[dayData.day]?.[type] ?? false
                        return (
                          <button
                            key={type}
                            onClick={() => toggleTask(dayData.day, type)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                              done
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-[#161b26] border-[#1e2535] hover:border-[#2d3748]'
                            )}
                          >
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-slate-500">{TASK_TYPE_LABELS[type]}</span>
                              <p className={cn('text-xs mt-0.5 truncate', done ? 'line-through text-slate-600' : 'text-slate-300')}>
                                {getDayTask(dayData, type)}
                              </p>
                            </div>
                          </button>
                        )
                      })}

                      {/* Note */}
                      <div className="mt-2">
                        {editingNote === dayData.day ? (
                          <div>
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder="Add notes for this day..."
                              rows={2}
                              className="w-full bg-[#161b26] border border-[#1e2535] text-white rounded-xl px-3 py-2 text-xs outline-none resize-none focus:border-blue-500"
                            />
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => saveNote(dayData.day)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg">Save</button>
                              <button onClick={() => setEditingNote(null)} className="text-xs text-slate-500 px-3 py-1 rounded-lg">Cancel</button>
                            </div>
                          </div>
                        ) : dayNote ? (
                          <p
                            onClick={() => { setEditingNote(dayData.day); setNoteText(dayNote) }}
                            className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-1.5 mt-1"
                          >
                            <StickyNote className="w-3 h-3" /> {dayNote}
                          </p>
                        ) : (
                          <button
                            onClick={() => { setEditingNote(dayData.day); setNoteText('') }}
                            className="text-[10px] text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add note
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
