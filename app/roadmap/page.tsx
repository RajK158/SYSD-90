'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ROADMAP_DATA } from '@/lib/data/roadmap'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/hooks/useAuth'
import { getCurrentWeek } from '@/lib/utils/date'
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle,
  Map, Code2, Wrench, ListChecks, Package, Plus, X, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type WeekCompletion = Record<string, boolean> // key: `${week}-${checklistIndex}`

export default function RoadmapPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const currentWeek = getCurrentWeek(profile?.start_date ?? null)

  const [expanded, setExpanded] = useState<number[]>([currentWeek])
  const [completions, setCompletions] = useState<WeekCompletion>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [customTasks, setCustomTasks] = useState<Record<number, string[]>>({})
  const [addingTask, setAddingTask] = useState<number | null>(null)
  const [newTaskText, setNewTaskText] = useState('')

  useEffect(() => { loadRoadmapData() }, [])

  async function loadRoadmapData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Load task completions for roadmap-type items (day 0 means roadmap checklist)
    const { data } = await supabase
      .from('task_completions')
      .select('task_key, completed, notes')
      .eq('user_id', user.id)
      .eq('task_type', 'revision')
      .like('task_key', 'roadmap-%')

    if (data) {
      const comp: WeekCompletion = {}
      data.forEach(d => { comp[d.task_key] = d.completed })
      setCompletions(comp)
    }

    setLoading(false)
  }

  async function toggleChecklist(weekNum: number, idx: number) {
    const key = `roadmap-w${weekNum}-c${idx}`
    const newVal = !completions[key]
    setCompletions(prev => ({ ...prev, [key]: newVal }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('task_completions').upsert({
      user_id: user.id,
      day_number: weekNum, // reuse day_number for week
      task_type: 'revision',
      task_key: key,
      completed: newVal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,day_number,task_type,task_key' })
  }

  function toggleExpand(week: number) {
    setExpanded(prev =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    )
  }

  function getWeekProgress(weekNum: number, checklistLength: number) {
    const done = Array.from({ length: checklistLength }, (_, i) => i)
      .filter(i => completions[`roadmap-w${weekNum}-c${i}`]).length
    return { done, total: checklistLength, pct: Math.round((done / checklistLength) * 100) }
  }

  const MONTH_COLORS = [
    'border-blue-500',
    'border-purple-500',
    'border-emerald-500',
  ]

  const MONTH_BADGE = [
    'bg-blue-500/10 text-blue-400',
    'bg-purple-500/10 text-purple-400',
    'bg-emerald-500/10 text-emerald-400',
  ]

  const MONTH_NAMES = ['Month 1: Foundations', 'Month 2: Distributed Systems', 'Month 3: Interview Prep']

  // Group by month
  const byMonth = [1, 2, 3].map(m => ROADMAP_DATA.filter(w => w.month === m))

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-400" />
            12-Week Roadmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your structured path from networking basics to interview-ready system designs</p>
        </div>

        {/* Overall progress */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(month => {
            const monthWeeks = ROADMAP_DATA.filter(w => w.month === month)
            const totalItems = monthWeeks.reduce((acc, w) => acc + w.checklist.length, 0)
            const doneItems = monthWeeks.reduce((acc, w) => {
              return acc + w.checklist.filter((_, i) => completions[`roadmap-w${w.week}-c${i}`]).length
            }, 0)
            const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
            return (
              <div key={month} className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">{MONTH_NAMES[month - 1]}</div>
                <div className={`text-xl font-black mb-2 ${month === 1 ? 'text-blue-400' : month === 2 ? 'text-purple-400' : 'text-emerald-400'}`}>{pct}%</div>
                <div className="h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${month === 1 ? 'bg-blue-500' : month === 2 ? 'bg-purple-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Weeks by month */}
        {byMonth.map((monthWeeks, monthIdx) => (
          <div key={monthIdx}>
            <div className={`flex items-center gap-2 mb-3`}>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${MONTH_BADGE[monthIdx]}`}>{MONTH_NAMES[monthIdx]}</span>
            </div>

            <div className="space-y-3">
              {monthWeeks.map(week => {
                const isExpanded = expanded.includes(week.week)
                const isCurrent = week.week === currentWeek
                const progress = getWeekProgress(week.week, week.checklist.length)

                return (
                  <div
                    key={week.week}
                    className={cn(
                      'bg-[#0f1117] border rounded-2xl overflow-hidden transition-all duration-200',
                      isCurrent ? 'border-blue-500/40 shadow-lg shadow-blue-500/5' : 'border-[#1e2535]',
                      MONTH_COLORS[monthIdx]
                    )}
                    style={{ borderLeft: `3px solid ${monthIdx === 0 ? '#3b82f6' : monthIdx === 1 ? '#8b5cf6' : '#10b981'}` }}
                  >
                    {/* Week header */}
                    <button
                      onClick={() => toggleExpand(week.week)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500">WEEK {week.week}</span>
                          {isCurrent && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">CURRENT</span>}
                        </div>
                        <h3 className="font-bold text-white text-sm">{week.title}</h3>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block">
                          <div className="w-24 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                              style={{ width: `${progress.pct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 text-right">{progress.done}/{progress.total}</div>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-slate-500" />
                          : <ChevronRight className="w-4 h-4 text-slate-500" />
                        }
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-[#1e2535] pt-5 space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                          {/* Topics */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Map className="w-3 h-3" /> Topics to Learn
                            </h4>
                            <ul className="space-y-1">
                              {week.topics.map(t => (
                                <li key={t} className="text-sm text-slate-300 flex items-start gap-1.5">
                                  <span className="text-blue-400 mt-1 flex-shrink-0">→</span> {t}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* DSA Focus */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Code2 className="w-3 h-3" /> DSA Focus
                            </h4>
                            <ul className="space-y-1">
                              {week.dsaFocus.map(t => (
                                <li key={t} className="text-sm text-slate-300 flex items-start gap-1.5">
                                  <span className="text-purple-400 mt-1 flex-shrink-0">→</span> {t}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 space-y-1">
                              {week.dsaTargets.map(target => (
                                <div key={target.topic} className="text-xs text-slate-500">
                                  {target.topic}: <span className="text-slate-300 font-medium">{target.min}{target.max > target.min ? `–${target.max}` : ''} problems</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Practical Exercises */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Practical Exercises
                          </h4>
                          <ul className="space-y-1">
                            {week.practicalExercises.map(ex => (
                              <li key={ex} className="text-sm text-slate-300 flex items-start gap-1.5">
                                <span className="text-cyan-400 mt-1 flex-shrink-0">→</span> {ex}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Checklist */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ListChecks className="w-3 h-3" /> End-of-Week Checklist
                          </h4>
                          <div className="space-y-2">
                            {week.checklist.map((item, idx) => {
                              const key = `roadmap-w${week.week}-c${idx}`
                              const done = !!completions[key]
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleChecklist(week.week, idx)}
                                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#161b26] border-[#1e2535] hover:border-[#2d3748]'}`}
                                >
                                  {done
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                                  }
                                  <span className={`text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Weekly Deliverables
                          </h4>
                          <ul className="space-y-1">
                            {week.deliverables.map(d => (
                              <li key={d} className="text-sm text-slate-400 flex items-start gap-1.5">
                                <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
