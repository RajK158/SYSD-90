'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { getCurrentDay, getCurrentWeek, getMotivationalMessage, formatDateKey } from '@/lib/utils/date'
import { calculateReadinessScore, TIER_COLORS, TIER_BG, TIER_EMOJI } from '@/lib/utils/readiness'
import { generateDailyTasks } from '@/lib/data/roadmap'
import { ROADMAP_DATA } from '@/lib/data/roadmap'
import AppShell from '@/components/layout/AppShell'
import {
  Flame, TrendingUp, Code2, Server, Target, Calendar,
  CheckCircle2, Circle, ChevronRight, Timer, Zap, ArrowRight,
  AlertTriangle, BookOpen
} from 'lucide-react'
import Link from 'next/link'

const ALL_DAYS = generateDailyTasks()
const TASK_TYPES = ['system_design', 'dsa', 'practical', 'revision'] as const

export default function DashboardPage() {
  const { profile } = useAuth()
  const supabase = createClient()

  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [dsaCount, setDsaCount] = useState({ total: 0, easy: 0, medium: 0, hard: 0 })
  const [caseStudyCount, setCaseStudyCount] = useState(0)
  const [mocksCount, setMocksCount] = useState(0)
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [markingDay, setMarkingDay] = useState(false)
  const [focusTimer, setFocusTimer] = useState<{ active: boolean; minutes: number; remaining: number } | null>(null)
  const [weeklyReviews, setWeeklyReviews] = useState(0)

  const currentDay = getCurrentDay(profile?.start_date ?? null)
  const currentWeek = getCurrentWeek(profile?.start_date ?? null)
  const todayTask = ALL_DAYS.find(d => d.day === currentDay)
  const nextIncompleteDay = ALL_DAYS.find(d => d.day > currentDay)
  const weekData = ROADMAP_DATA.find(w => w.week === currentWeek)

  const completedToday = Object.values(todayCompletions).filter(Boolean).length
  const todayProgress = TASK_TYPES.length > 0 ? Math.round((completedToday / TASK_TYPES.length) * 100) : 0
  const overallProgress = Math.round((currentDay / 90) * 100)

  const readiness = calculateReadinessScore({
    dsaSolved: dsaCount.total,
    caseStudySectionsCompleted: caseStudyCount,
    mocksCompleted: mocksCount,
    currentStreak: streak,
    weeklyReviewsCompleted: weeklyReviews,
  })

  useEffect(() => {
    if (!profile) return
    loadDashboardData()
  }, [profile])

  async function loadDashboardData() {
    setLoading(true)
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) { setLoading(false); return }

    const today = formatDateKey()

    // Load streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (streakData) {
      setStreak(streakData.current_streak)
      setLongestStreak(streakData.longest_streak)
    }

    // Load today's completions
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_type, completed')
      .eq('user_id', userId)
      .eq('day_number', currentDay)
    if (completions) {
      const map: Record<string, boolean> = {}
      completions.forEach(c => { map[c.task_type] = c.completed })
      setTodayCompletions(map)
    }

    // DSA count
    const { count: dsaTotal } = await supabase
      .from('dsa_problems')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Solved')
    const { count: dsaEasy } = await supabase
      .from('dsa_problems')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('difficulty', 'Easy')
      .eq('status', 'Solved')
    const { count: dsaMedium } = await supabase
      .from('dsa_problems')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('difficulty', 'Medium')
      .eq('status', 'Solved')
    const { count: dsaHard } = await supabase
      .from('dsa_problems')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('difficulty', 'Hard')
      .eq('status', 'Solved')
    setDsaCount({
      total: dsaTotal ?? 0,
      easy: dsaEasy ?? 0,
      medium: dsaMedium ?? 0,
      hard: dsaHard ?? 0,
    })

    // Case study sections
    const { count: csCount } = await supabase
      .from('case_study_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
    setCaseStudyCount(csCount ?? 0)

    // Mocks
    const { count: mCount } = await supabase
      .from('mock_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setMocksCount(mCount ?? 0)

    // Weekly reviews
    const { count: wrCount } = await supabase
      .from('weekly_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setWeeklyReviews(wrCount ?? 0)

    setLoading(false)
  }

  async function toggleTask(taskType: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return
    const newValue = !todayCompletions[taskType]
    setTodayCompletions(prev => ({ ...prev, [taskType]: newValue }))

    await supabase
      .from('task_completions')
      .upsert({
        user_id: userId,
        day_number: currentDay,
        task_type: taskType,
        task_key: taskType,
        completed: newValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,day_number,task_type,task_key' })

    // Update streak if 70%+ complete
    const newCompletions = { ...todayCompletions, [taskType]: newValue }
    const completedCount = Object.values(newCompletions).filter(Boolean).length
    const pct = (completedCount / TASK_TYPES.length) * 100

    if (pct >= 70) {
      const today = formatDateKey()
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingStreak) {
        const calendar = existingStreak.streak_calendar || {}
        if (!calendar[today]) {
          calendar[today] = true
          const newCurrent = (existingStreak.last_active_date === formatDateKey(new Date(Date.now() - 86400000)))
            ? existingStreak.current_streak + 1
            : 1
          const newLongest = Math.max(existingStreak.longest_streak, newCurrent)
          await supabase.from('streaks').update({
            current_streak: newCurrent,
            longest_streak: newLongest,
            total_active_days: existingStreak.total_active_days + 1,
            last_active_date: today,
            streak_calendar: calendar,
          }).eq('user_id', userId)
          setStreak(newCurrent)
          setLongestStreak(newLongest)
        }
      } else {
        await supabase.from('streaks').insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          total_active_days: 1,
          last_active_date: today,
          streak_calendar: { [today]: true },
        })
        setStreak(1)
      }
    }
  }

  function startFocusTimer(minutes: number) {
    setFocusTimer({ active: true, minutes, remaining: minutes * 60 })
    const interval = setInterval(() => {
      setFocusTimer(prev => {
        if (!prev) { clearInterval(interval); return null }
        if (prev.remaining <= 1) { clearInterval(interval); return null }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  const TASK_LABELS: Record<string, { label: string; emoji: string; task: string }> = {
    system_design: { label: 'System Design', emoji: '🏗️', task: todayTask?.systemDesignTask ?? '' },
    dsa: { label: 'DSA Practice', emoji: '💻', task: todayTask?.dsaTask ?? '' },
    practical: { label: 'Practical', emoji: '🔨', task: todayTask?.practicalTask ?? '' },
    revision: { label: 'Revision', emoji: '📚', task: todayTask?.revisionTask ?? '' },
  }

  const motivational = getMotivationalMessage(currentDay, streak)

  if (!profile?.start_date) {
    return (
      <AppShell streak={streak}>
        <OnboardingCard />
      </AppShell>
    )
  }

  return (
    <AppShell streak={streak}>
      <div className="space-y-6">
        {/* Motivational banner */}
        <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl px-6 py-4">
          <p className="text-slate-300 font-medium">{motivational}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Current Day" value={`${currentDay}/90`} sub={`Week ${currentWeek}/12`} color="text-blue-400" icon={<Calendar className="w-4 h-4" />} />
          <StatCard label="Streak" value={`${streak} 🔥`} sub={`Best: ${longestStreak}`} color="text-orange-400" icon={<Flame className="w-4 h-4" />} />
          <StatCard label="DSA Solved" value={dsaCount.total.toString()} sub={`${dsaCount.easy}E · ${dsaCount.medium}M · ${dsaCount.hard}H`} color="text-purple-400" icon={<Code2 className="w-4 h-4" />} />
          <StatCard label="Case Studies" value={`${Math.round(caseStudyCount / 12 * 100) || 0}%`} sub={`${caseStudyCount}/144 sections`} color="text-cyan-400" icon={<Server className="w-4 h-4" />} />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Mission */}
          <div className="lg:col-span-2 bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Today&apos;s Mission
                <span className="text-slate-500 font-normal text-sm">Day {currentDay}</span>
              </h2>
              <span className="text-sm font-bold text-blue-400">{todayProgress}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[#1e2535] rounded-full mb-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {TASK_TYPES.map(type => {
                const { label, emoji, task } = TASK_LABELS[type]
                const done = todayCompletions[type]
                return (
                  <button
                    key={type}
                    onClick={() => toggleTask(type)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                      done
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[#161b26] border-[#1e2535] hover:border-[#2d3748]'
                    }`}
                  >
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <Circle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold mb-0.5 ${done ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {emoji} {label}
                      </div>
                      <div className={`text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task || `${label} for Week ${currentWeek}`}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[#1e2535]">
              <Link href="/dsa" className="flex items-center gap-1.5 text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-xl transition-colors">
                <Code2 className="w-3.5 h-3.5" />
                Log DSA Problem
              </Link>
              <Link href="/notes" className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                Add Note
              </Link>
              <Link href="/mocks" className="flex items-center gap-1.5 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-xl transition-colors">
                <Zap className="w-3.5 h-3.5" />
                Start Mock
              </Link>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Readiness Score */}
            <div className={`${TIER_BG[readiness.tier]} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Readiness Score</span>
                <span className="text-2xl">{TIER_EMOJI[readiness.tier]}</span>
              </div>
              <div className={`text-3xl font-black mb-1 ${TIER_COLORS[readiness.tier]}`}>{readiness.score}</div>
              <div className={`text-sm font-bold mb-3 ${TIER_COLORS[readiness.tier]}`}>{readiness.tier}</div>
              <div className="h-1.5 bg-[#0a0b0e]/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    readiness.tier === 'Peak Mode' ? 'bg-emerald-500' :
                    readiness.tier === 'Interview-Ready' ? 'bg-purple-500' :
                    readiness.tier === 'Consistent' ? 'bg-cyan-500' :
                    readiness.tier === 'Building' ? 'bg-blue-500' : 'bg-slate-500'
                  }`}
                  style={{ width: `${readiness.score}%` }}
                />
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-300">Overall Progress</span>
                <span className="text-sm font-bold text-blue-400">{overallProgress}%</span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <ProgressRing progress={overallProgress} size={80} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-500">Day</div>
                  <div className="text-sm font-bold text-white">{currentDay}/90</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Week</div>
                  <div className="text-sm font-bold text-white">{currentWeek}/12</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Mocks</div>
                  <div className="text-sm font-bold text-white">{mocksCount}</div>
                </div>
              </div>
            </div>

            {/* Focus Timer */}
            <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-300">Focus Timer</span>
              </div>
              {focusTimer ? (
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-white mb-3">
                    {String(Math.floor(focusTimer.remaining / 60)).padStart(2, '0')}:
                    {String(focusTimer.remaining % 60).padStart(2, '0')}
                  </div>
                  <button onClick={() => setFocusTimer(null)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                    Stop
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(min => (
                    <button
                      key={min}
                      onClick={() => startFocusTimer(min)}
                      className="bg-[#161b26] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-[#1e2535] rounded-xl py-2 text-xs font-semibold text-slate-400 transition-all"
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Week Focus + Next Up */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Current Week Focus */}
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-white text-sm">Week {currentWeek} Focus</h3>
            </div>
            <p className="text-slate-300 font-bold mb-3">{weekData?.title}</p>
            <div className="space-y-1.5">
              {weekData?.topics.slice(0, 4).map(topic => (
                <div key={topic} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                  {topic}
                </div>
              ))}
              {(weekData?.topics.length ?? 0) > 4 && (
                <Link href="/roadmap" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-1">
                  +{(weekData?.topics.length ?? 0) - 4} more topics <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Next Up */}
          <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Next Up</h3>
            </div>
            {nextIncompleteDay ? (
              <div>
                <div className="text-xs text-slate-500 mb-1">Day {nextIncompleteDay.day} · Week {nextIncompleteDay.week}</div>
                <p className="text-slate-200 text-sm font-medium mb-2">{nextIncompleteDay.systemDesignTask}</p>
                <p className="text-slate-500 text-sm">{nextIncompleteDay.dsaTask}</p>
              </div>
            ) : (
              <div className="text-emerald-400 font-bold">🎉 All days complete!</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-black mb-0.5 ${color}`}>{value}</div>
      <div className="text-slate-500 text-xs">{sub}</div>
    </div>
  )
}

function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e2535" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="url(#grad)" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="middle"
        className="rotate-90 fill-white text-sm font-bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: '14px', fontWeight: 700 }}
      >
        {progress}%
      </text>
    </svg>
  )
}

function OnboardingCard() {
  const { profile, updateProfile } = useAuth()
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({ start_date: startDate })
    setSaving(false)
    window.location.reload()
  }

  return (
    <div className="max-w-lg mx-auto pt-12">
      <div className="bg-[#0f1117] border border-blue-500/30 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {profile?.username?.split(' ')[0] ?? 'there'}!</h2>
        <p className="text-slate-400 mb-6">Set your Day 1 start date to begin your 90-day journey. This determines which day you&apos;re on in the roadmap.</p>
        <div className="text-left mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-[#161b26] border border-[#1e2535] text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Start My 90-Day Journey'}
        </button>
      </div>
    </div>
  )
}
