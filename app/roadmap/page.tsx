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

  // Month left-border colors applied via CSS class in globals.css
  const MONTH_LEFT_BORDER = [
    '#E8A838',   // Month 1 — amber
    '#a78bfa',   // Month 2 — violet
    '#10b981',   // Month 3 — emerald
  ]

  const MONTH_BADGE = [
    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  ]

  const MONTH_NAMES = ['Month 1: Foundations', 'Month 2: Distributed Systems', 'Month 3: Interview Prep']

  // Group by month
  const byMonth = [1, 2, 3].map(m => ROADMAP_DATA.filter(w => w.month === m))

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#F0EDED' }}>
            <Map className="w-6 h-6" style={{ color: '#E8A838' }} />
            12-Week Roadmap
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9A9494' }}>Your structured path from networking basics to interview-ready system designs</p>
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
            const [accent, bar] = month === 1 ? ['#E8A838', '#E8A838'] : month === 2 ? ['#a78bfa', '#a78bfa'] : ['#10b981', '#10b981']
            return (
              <div key={month} style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 12, padding: '14px 16px' }}>
                <div className="text-xs mb-1" style={{ color: '#5C5757' }}>{MONTH_NAMES[month - 1]}</div>
                <div className="text-xl font-black mb-2" style={{ color: accent }}>{pct}%</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1F1F1F' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bar }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Weeks by month */}
        {byMonth.map((monthWeeks, monthIdx) => (
          <div key={monthIdx}>
            <div className="flex items-center gap-2 mb-3">
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
                    className="overflow-hidden transition-all duration-200"
                    style={{
                      background: '#111111',
                      border: isCurrent ? `1px solid rgba(232,168,56,0.30)` : '1px solid #1F1F1F',
                      borderLeft: `3px solid ${MONTH_LEFT_BORDER[monthIdx]}`,
                      borderRadius: 16,
                      boxShadow: isCurrent ? '0 4px 24px rgba(232,168,56,0.06)' : 'none',
                    }}
                  >
                    {/* Week header */}
                    <button
                      onClick={() => toggleExpand(week.week)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold tracking-wider" style={{ color: '#5C5757' }}>WEEK {week.week}</span>
                          {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,168,56,0.12)', color: '#E8A838' }}>CURRENT</span>}
                        </div>
                        <h3 className="font-bold text-sm" style={{ color: '#F0EDED' }}>{week.title}</h3>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: '#1F1F1F' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${progress.pct}%`, background: `linear-gradient(90deg, ${MONTH_LEFT_BORDER[monthIdx]}, ${MONTH_LEFT_BORDER[monthIdx]}aa)` }}
                            />
                          </div>
                          <div className="text-[10px] mt-0.5 text-right" style={{ color: '#5C5757' }}>{progress.done}/{progress.total}</div>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" style={{ color: '#5C5757' }} />
                          : <ChevronRight className="w-4 h-4" style={{ color: '#5C5757' }} />
                        }
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-5 space-y-5" style={{ borderTop: '1px solid #1F1F1F' }}>
                        <div className="grid sm:grid-cols-2 gap-5">
                          {/* Topics */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#9A9494' }}>
                              <Map className="w-3 h-3" /> Topics to Learn
                            </h4>
                            <ul className="space-y-1">
                              {week.topics.map(t => (
                                <li key={t} className="text-sm flex items-start gap-1.5" style={{ color: '#D4D0D0' }}>
                                  <span className="mt-1 flex-shrink-0" style={{ color: MONTH_LEFT_BORDER[monthIdx] }}>→</span> {t}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* DSA Focus */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#9A9494' }}>
                              <Code2 className="w-3 h-3" /> DSA Focus
                            </h4>
                            <ul className="space-y-1">
                              {week.dsaFocus.map(t => (
                                <li key={t} className="text-sm flex items-start gap-1.5" style={{ color: '#D4D0D0' }}>
                                  <span className="mt-1 flex-shrink-0" style={{ color: '#a78bfa' }}>→</span> {t}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 space-y-1">
                              {week.dsaTargets.map(target => (
                                <div key={target.topic} className="text-xs" style={{ color: '#5C5757' }}>
                                  {target.topic}: <span className="font-medium" style={{ color: '#9A9494' }}>{target.min}{target.max > target.min ? `–${target.max}` : ''} problems</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Practical Exercises */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#9A9494' }}>
                            <Wrench className="w-3 h-3" /> Practical Exercises
                          </h4>
                          <ul className="space-y-1">
                            {week.practicalExercises.map(ex => (
                              <li key={ex} className="text-sm flex items-start gap-1.5" style={{ color: '#D4D0D0' }}>
                                <span className="mt-1 flex-shrink-0" style={{ color: '#34d399' }}>→</span> {ex}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Checklist — only marks complete on explicit user click */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#9A9494' }}>
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
                                  className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                                  style={{
                                    background: done ? 'rgba(52,211,153,0.05)' : '#161616',
                                    border: done ? '1px solid rgba(52,211,153,0.18)' : '1px solid #1F1F1F',
                                  }}
                                  onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = '#2A2A2A' }}
                                  onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = '#1F1F1F' }}
                                >
                                  {done
                                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                                    : <Circle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3A3A3A' }} />
                                  }
                                  <span className="text-sm" style={{ color: done ? '#5C5757' : '#D4D0D0', textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: '#9A9494' }}>
                            <Package className="w-3 h-3" /> Weekly Deliverables
                          </h4>
                          <ul className="space-y-1">
                            {week.deliverables.map(d => (
                              <li key={d} className="text-sm flex items-start gap-1.5" style={{ color: '#9A9494' }}>
                                <span className="mt-1 flex-shrink-0" style={{ color: '#34d399' }}>✓</span> {d}
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
