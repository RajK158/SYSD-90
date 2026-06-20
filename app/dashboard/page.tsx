'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  getCurrentDay, getCurrentWeek, getMotivationalMessage, formatDateKey,
} from '@/lib/utils/date'
import { calculateReadinessScore, TIER_EMOJI } from '@/lib/utils/readiness'
import { generateDailyTasks, ROADMAP_DATA } from '@/lib/data/roadmap'
import AppShell from '@/components/layout/AppShell'
import OrbitSystem, { PlanetModule } from '@/components/orbit/OrbitSystem'
import TodayMission, { MissionTask } from '@/components/orbit/TodayMission'
import {
  Flame, TrendingUp, Code2, Server, Timer,
  ChevronRight, Calendar, ArrowRight, Rocket,
} from 'lucide-react'
import Link from 'next/link'

/* ── Constants ── */
const ALL_DAYS = generateDailyTasks()
const TASK_TYPES = ['system_design', 'dsa', 'practical', 'revision'] as const

const TASK_META: Record<string, { label: string; emoji: string }> = {
  system_design: { label: 'System Design',  emoji: '🏗️' },
  dsa:           { label: 'DSA Practice',   emoji: '💻' },
  practical:     { label: 'Practical',       emoji: '🔨' },
  revision:      { label: 'Revision',        emoji: '📚' },
}

/* ── Readiness tier badge colors ── */
const TIER_COLOR: Record<string, string> = {
  'Beginner':        '#9A9494',
  'Building':        '#60a5fa',
  'Consistent':      '#34d399',
  'Interview-Ready': '#a78bfa',
  'Peak Mode':       '#E8A838',
}

/* ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const { profile } = useAuth()
  const supabase = createClient()

  /* ── State ── */
  const [streak, setStreak]                     = useState(0)
  const [longestStreak, setLongestStreak]       = useState(0)
  const [dsaCount, setDsaCount]                 = useState({ total: 0, easy: 0, medium: 0, hard: 0 })
  const [caseStudyCount, setCaseStudyCount]     = useState(0)
  const [mocksCount, setMocksCount]             = useState(0)
  const [roadmapChecked, setRoadmapChecked]     = useState(0)  // total roadmap checklist items done
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({})
  const [weeklyReviews, setWeeklyReviews]       = useState(0)
  const [loading, setLoading]                   = useState(true)
  const [focusTimer, setFocusTimer]             = useState<{ minutes: number; remaining: number } | null>(null)

  /* ── Derived values ── */
  const currentDay      = getCurrentDay(profile?.start_date ?? null)
  const currentWeek     = getCurrentWeek(profile?.start_date ?? null)
  const daysRemaining   = Math.max(0, 90 - currentDay)
  const todayTask       = ALL_DAYS.find(d => d.day === currentDay)
  const weekData        = ROADMAP_DATA.find(w => w.week === currentWeek)
  const nextDay         = ALL_DAYS.find(d => d.day === currentDay + 1)
  const overallPct      = Math.round(Math.min((currentDay / 90) * 100, 100))
  const motivational    = getMotivationalMessage(currentDay, streak)

  const completedToday  = Object.values(todayCompletions).filter(Boolean).length
  const todayProgress   = TASK_TYPES.length > 0
    ? Math.round((completedToday / TASK_TYPES.length) * 100) : 0

  const readiness = calculateReadinessScore({
    dsaSolved: dsaCount.total,
    caseStudySectionsCompleted: caseStudyCount,
    mocksCompleted: mocksCount,
    currentStreak: streak,
    weeklyReviewsCompleted: weeklyReviews,
  })

  /* ── Planet modules with derived progress ── */
  const planets: PlanetModule[] = [
    {
      id:       'roadmap',
      label:    'Roadmap',
      emoji:    '🗺️',
      href:     '/roadmap',
      progress: Math.round(Math.min((roadmapChecked / (12 * 5)) * 100, 100)), // 12 weeks × ~5 checklist items
      status:   `Week ${currentWeek}/12`,
      color:    '#E8A838',
    },
    {
      id:       'dsa',
      label:    'DSA',
      emoji:    '💻',
      href:     '/dsa',
      progress: Math.round(Math.min((dsaCount.total / 150) * 100, 100)),
      status:   `${dsaCount.total}/150 solved`,
      color:    '#a78bfa',
    },
    {
      id:       'portfolio',
      label:    'Projects',
      emoji:    '📁',
      href:     '/portfolio',
      progress: 0,   // portfolio progress comes from portfolio_progress table — default 0
      status:   'Build case repo',
      color:    '#60a5fa',
    },
    {
      id:       'case-studies',
      label:    'Case Studies',
      emoji:    '🔬',
      href:     '/case-studies',
      progress: Math.round(Math.min((caseStudyCount / 144) * 100, 100)),
      status:   `${caseStudyCount}/144 sections`,
      color:    '#34d399',
    },
    {
      id:       'mocks',
      label:    'Mocks',
      emoji:    '🎤',
      href:     '/mocks',
      progress: Math.round(Math.min((mocksCount / 10) * 100, 100)),
      status:   `${mocksCount} logged`,
      color:    '#f97316',
    },
  ]

  /* ── Today's mission tasks ── */
  const missionTasks: MissionTask[] = TASK_TYPES.map(type => ({
    type,
    label: TASK_META[type].label,
    emoji: TASK_META[type].emoji,
    task:  (todayTask as Record<string, string> | undefined)?.[
      type === 'system_design' ? 'systemDesignTask' :
      type === 'dsa'           ? 'dsaTask' :
      type === 'practical'     ? 'practicalTask' :
                                 'revisionTask'
    ] ?? `${TASK_META[type].label} — Week ${currentWeek}`,
    done: todayCompletions[type] ?? false,
  }))

  /* ── Data loading ── */
  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    setLoading(true)
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) { setLoading(false); return }

    /* Streak */
    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', userId).single()
    if (streakData) { setStreak(streakData.current_streak); setLongestStreak(streakData.longest_streak) }

    /* Today's completions */
    const { data: completions } = await supabase
      .from('task_completions').select('task_type, completed')
      .eq('user_id', userId).eq('day_number', currentDay)
    if (completions) {
      const map: Record<string, boolean> = {}
      completions.forEach(c => { map[c.task_type] = c.completed })
      setTodayCompletions(map)
    }

    /* DSA */
    const { count: dsaTotal }  = await supabase.from('dsa_problems').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Solved')
    const { count: dsaEasy }   = await supabase.from('dsa_problems').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('difficulty', 'Easy').eq('status', 'Solved')
    const { count: dsaMedium } = await supabase.from('dsa_problems').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('difficulty', 'Medium').eq('status', 'Solved')
    const { count: dsaHard }   = await supabase.from('dsa_problems').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('difficulty', 'Hard').eq('status', 'Solved')
    setDsaCount({ total: dsaTotal ?? 0, easy: dsaEasy ?? 0, medium: dsaMedium ?? 0, hard: dsaHard ?? 0 })

    /* Case studies */
    const { count: csCount } = await supabase.from('case_study_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true)
    setCaseStudyCount(csCount ?? 0)

    /* Mocks */
    const { count: mCount } = await supabase.from('mock_interviews').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    setMocksCount(mCount ?? 0)

    /* Weekly reviews */
    const { count: wrCount } = await supabase.from('weekly_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    setWeeklyReviews(wrCount ?? 0)

    /* Roadmap completions (used for Roadmap planet progress) */
    const { count: rmCount } = await supabase.from('task_completions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true)
    setRoadmapChecked(rmCount ?? 0)

    setLoading(false)
  }

  /* ── Task toggle (only marks done on explicit click) ── */
  async function toggleTask(taskType: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return
    const newValue = !todayCompletions[taskType]
    setTodayCompletions(prev => ({ ...prev, [taskType]: newValue }))

    await supabase.from('task_completions').upsert({
      user_id: userId,
      day_number: currentDay,
      task_type: taskType,
      task_key: taskType,
      completed: newValue,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,day_number,task_type,task_key' })

    /* Update streak if ≥70% done */
    const newCompletions = { ...todayCompletions, [taskType]: newValue }
    const doneCount = Object.values(newCompletions).filter(Boolean).length
    if ((doneCount / TASK_TYPES.length) >= 0.7) {
      const today = formatDateKey()
      const { data: existing } = await supabase.from('streaks').select('*').eq('user_id', userId).single()
      if (existing) {
        const cal = existing.streak_calendar || {}
        if (!cal[today]) {
          cal[today] = true
          const newCurrent = existing.last_active_date === formatDateKey(new Date(Date.now() - 86400000))
            ? existing.current_streak + 1 : 1
          const newLongest = Math.max(existing.longest_streak, newCurrent)
          await supabase.from('streaks').update({
            current_streak: newCurrent, longest_streak: newLongest,
            total_active_days: existing.total_active_days + 1,
            last_active_date: today, streak_calendar: cal,
          }).eq('user_id', userId)
          setStreak(newCurrent); setLongestStreak(newLongest)
        }
      } else {
        await supabase.from('streaks').insert({
          user_id: userId, current_streak: 1, longest_streak: 1,
          total_active_days: 1, last_active_date: formatDateKey(), streak_calendar: { [formatDateKey()]: true },
        })
        setStreak(1)
      }
    }
  }

  /* ── Focus timer ── */
  function startTimer(min: number) {
    setFocusTimer({ minutes: min, remaining: min * 60 })
    const id = setInterval(() => {
      setFocusTimer(prev => {
        if (!prev || prev.remaining <= 1) { clearInterval(id); return null }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  /* ── Onboarding (no start_date) ── */
  if (!profile?.start_date) {
    return (
      <AppShell hideTopBar>
        <OrbitOnboarding />
      </AppShell>
    )
  }

  /* ── Main My Orbit layout ── */
  return (
    <AppShell hideTopBar>
      <div className="flex flex-col gap-6 min-h-full">

        {/* ── Mission Control Header ── */}
        <div
          className="flex flex-wrap items-center gap-3 px-1"
          style={{ paddingTop: 4 }}
        >
          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight" style={{ color: '#F0EDED' }}>
              My Orbit
            </h1>
            <p className="text-sm mt-0.5 truncate" style={{ color: '#5C5757' }}>
              {motivational}
            </p>
          </div>

          {/* Mission pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Pill icon={<Calendar className="w-3.5 h-3.5" />} label={`Day ${currentDay}`} sub="/90" />
            <Pill icon={<TrendingUp className="w-3.5 h-3.5" />} label={`Week ${currentWeek}`} sub="/12" />
            {streak > 0 && (
              <Pill
                icon={<Flame className="w-3.5 h-3.5" />}
                label={`${streak}`}
                sub="streak"
                accent
              />
            )}
            {/* Readiness badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: `${TIER_COLOR[readiness.tier]}12`,
                border: `1px solid ${TIER_COLOR[readiness.tier]}25`,
                color: TIER_COLOR[readiness.tier],
              }}
            >
              <span>{TIER_EMOJI[readiness.tier]}</span>
              <span>{readiness.tier}</span>
            </div>
          </div>
        </div>

        {/* ── Hero: Orbit + Mission Panel ── */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Orbit visualization */}
          <div
            className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, #0F0E0B 0%, #0A0A0A 60%, #080808 100%)',
              border: '1px solid #1A1A1A',
              minHeight: 480,
            }}
          >
            {/* Ambient glow behind orbit */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,168,56,0.04) 0%, transparent 70%)',
              }}
            />

            {/* Orbit label */}
            <div className="absolute top-5 left-6 flex items-center gap-2">
              <Rocket className="w-3.5 h-3.5" style={{ color: '#3A3A3A' }} />
              <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#2A2A2A' }}>
                Mission Orbit
              </span>
            </div>

            {/* Overall progress arc label */}
            <div className="absolute top-5 right-6 text-right">
              <div className="text-xs font-bold" style={{ color: '#E8A838' }}>{overallPct}%</div>
              <div className="text-[10px]" style={{ color: '#3A3A3A' }}>overall</div>
            </div>

            {/* The orbit system — responsive size */}
            <div className="relative z-10">
              <OrbitSystemResponsive
                currentDay={currentDay}
                daysRemaining={daysRemaining}
                planets={planets}
              />
            </div>
          </div>

          {/* Today's Mission panel */}
          <div style={{ minHeight: 480 }}>
            <TodayMission
              day={currentDay}
              week={currentWeek}
              tasks={missionTasks}
              onToggle={toggleTask}
              loading={loading}
            />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="DSA Solved"
            value={dsaCount.total}
            sub={`${dsaCount.easy}E · ${dsaCount.medium}M · ${dsaCount.hard}H`}
            color="#a78bfa"
            icon={<Code2 className="w-4 h-4" />}
            href="/dsa"
            max={150}
          />
          <StatCard
            label="Case Studies"
            value={caseStudyCount}
            sub={`/ 144 sections`}
            color="#34d399"
            icon={<Server className="w-4 h-4" />}
            href="/case-studies"
            max={144}
          />
          <StatCard
            label="Mock Interviews"
            value={mocksCount}
            sub={mocksCount >= 10 ? 'Target reached!' : `${10 - mocksCount} to target`}
            color="#f97316"
            icon={<Rocket className="w-4 h-4" />}
            href="/mocks"
            max={10}
          />
          <StatCard
            label="Streak"
            value={streak}
            sub={`Best: ${longestStreak} days`}
            color="#E8A838"
            icon={<Flame className="w-4 h-4" />}
            href="/daily"
          />
        </div>

        {/* ── Bottom row: Week Focus + Readiness + Timer ── */}
        <div className="grid sm:grid-cols-3 gap-4 pb-2">

          {/* Week Focus */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5C5757' }}>
                Week {currentWeek} Focus
              </h3>
              <Link href="/roadmap" className="flex items-center gap-0.5 text-xs transition-colors" style={{ color: '#3A3A3A' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E8A838')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}>
                View <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="font-bold text-sm mb-3" style={{ color: '#F0EDED' }}>
              {weekData?.title ?? 'Loading...'}
            </p>
            <div className="space-y-1.5">
              {weekData?.topics.slice(0, 4).map(t => (
                <div key={t} className="flex items-center gap-2 text-xs" style={{ color: '#9A9494' }}>
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#E8A838' }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Score */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5C5757' }}>
                Readiness Score
              </h3>
              <span className="text-xl">{TIER_EMOJI[readiness.tier]}</span>
            </div>
            <div className="text-4xl font-black mb-0.5" style={{ color: TIER_COLOR[readiness.tier] }}>
              {readiness.score}
            </div>
            <div className="text-sm font-bold mb-4" style={{ color: TIER_COLOR[readiness.tier] }}>
              {readiness.tier}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${readiness.score}%`,
                  background: TIER_COLOR[readiness.tier],
                }}
              />
            </div>
            {/* Breakdown mini */}
            <div className="mt-3 space-y-1">
              {readiness.breakdown.map(({ label, earned, max }) => (
                <div key={label} className="flex items-center justify-between text-[10px]" style={{ color: '#3A3A3A' }}>
                  <span className="truncate">{label.split(' ')[0]}</span>
                  <span className="font-mono">{earned}/{max}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Timer */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#5C5757' }}>
              Focus Timer
            </h3>
            {focusTimer ? (
              <div className="text-center">
                <div
                  className="text-4xl font-mono font-black mb-4"
                  style={{ color: '#F0EDED', letterSpacing: 2 }}
                >
                  {String(Math.floor(focusTimer.remaining / 60)).padStart(2, '0')}:
                  {String(focusTimer.remaining % 60).padStart(2, '0')}
                </div>
                <div
                  className="h-1 rounded-full mb-4 overflow-hidden"
                  style={{ background: '#1A1A1A' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(focusTimer.remaining / (focusTimer.minutes * 60)) * 100}%`,
                      background: 'linear-gradient(90deg, #E8A838, #D4761C)',
                    }}
                  />
                </div>
                <button
                  onClick={() => setFocusTimer(null)}
                  className="text-xs px-4 py-1.5 rounded-xl transition-colors"
                  style={{ color: '#5C5757', border: '1px solid #1A1A1A' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#5C5757'; e.currentTarget.style.borderColor = '#1A1A1A' }}
                >
                  Stop
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs mb-4" style={{ color: '#3A3A3A' }}>
                  Deep-focus your study session
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 90].map(min => (
                    <button
                      key={min}
                      onClick={() => startTimer(min)}
                      className="py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: '#141414', border: '1px solid #1A1A1A', color: '#5C5757' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(232,168,56,0.08)'
                        e.currentTarget.style.borderColor = 'rgba(232,168,56,0.22)'
                        e.currentTarget.style.color = '#E8A838'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#141414'
                        e.currentTarget.style.borderColor = '#1A1A1A'
                        e.currentTarget.style.color = '#5C5757'
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  )
}

/* ──────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────── */

/** Responsive wrapper that picks orbit size based on viewport */
function OrbitSystemResponsive(props: {
  currentDay: number
  daysRemaining: number
  planets: PlanetModule[]
}) {
  const [size, setSize] = useState(420)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w < 480) setSize(300)
      else if (w < 768) setSize(340)
      else if (w < 1024) setSize(380)
      else setSize(440)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return <OrbitSystem {...props} size={size} />
}

function Pill({ icon, label, sub, accent }: {
  icon: React.ReactNode
  label: string
  sub: string
  accent?: boolean
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
      style={{
        background: accent ? 'rgba(232,168,56,0.10)' : '#111111',
        border: accent ? '1px solid rgba(232,168,56,0.22)' : '1px solid #1A1A1A',
        color: accent ? '#E8A838' : '#9A9494',
      }}
    >
      {icon}
      <span className="font-bold" style={{ color: accent ? '#E8A838' : '#F0EDED' }}>{label}</span>
      <span style={{ color: '#5C5757' }}>{sub}</span>
    </div>
  )
}

function StatCard({
  label, value, sub, color, icon, href, max,
}: {
  label: string
  value: number
  sub: string
  color: string
  icon: React.ReactNode
  href: string
  max?: number
}) {
  const pct = max ? Math.min(Math.round((value / max) * 100), 100) : null
  return (
    <Link
      href={href}
      className="block p-5 rounded-2xl group transition-all"
      style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}30`
        e.currentTarget.style.background = '#111111'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1A1A1A'
        e.currentTarget.style.background = '#0F0F0F'
      }}
    >
      <div className="flex items-center gap-1.5 mb-3" style={{ color: '#3A3A3A' }}>
        <div style={{ color }}>{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black mb-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-xs mb-3" style={{ color: '#5C5757' }}>{sub}</div>
      {pct !== null && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      )}
    </Link>
  )
}

/* ── Onboarding card (shown when no start_date) ── */
function OrbitOnboarding() {
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
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Decorative orbit rings */}
        <div className="relative flex items-center justify-center mb-8">
          <div
            className="absolute w-48 h-48 rounded-full"
            style={{ border: '1px dashed rgba(232,168,56,0.12)' }}
          />
          <div
            className="absolute w-32 h-32 rounded-full"
            style={{ border: '1px dashed rgba(232,168,56,0.20)' }}
          />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E8A838, #D4761C)',
              boxShadow: '0 0 40px rgba(232,168,56,0.30)',
            }}
          >
            <Rocket className="w-8 h-8 text-[#0C0C0C]" />
          </div>
        </div>

        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: '#0F0F0F',
            border: '1px solid rgba(232,168,56,0.18)',
          }}
        >
          <h2 className="text-2xl font-black mb-2" style={{ color: '#F0EDED' }}>
            Launch Your Orbit
          </h2>
          <p className="text-sm mb-8" style={{ color: '#9A9494' }}>
            Welcome{profile?.username ? `, ${profile.username.split(' ')[0]}` : ''}! Set your Day 1 start date to
            begin the 90-day mission. This determines your daily roadmap position.
          </p>

          <div className="text-left mb-6">
            <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#5C5757' }}>
              Day 1 — Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', color: '#F0EDED' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,168,56,0.50)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #E8A838, #D4761C)',
              color: '#0C0C0C',
              boxShadow: '0 4px 20px rgba(232,168,56,0.25)',
            }}
          >
            {saving ? 'Launching...' : '🚀 Start My 90-Day Mission'}
          </button>
        </div>
      </div>
    </div>
  )
}
