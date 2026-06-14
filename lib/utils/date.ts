import { differenceInDays, format, isSameDay, parseISO, startOfDay } from 'date-fns'

export function getCurrentDay(startDate: string | null): number {
  if (!startDate) return 1
  const start = startOfDay(parseISO(startDate))
  const today = startOfDay(new Date())
  const diff = differenceInDays(today, start) + 1
  return Math.max(1, Math.min(diff, 90))
}

export function getCurrentWeek(startDate: string | null): number {
  const day = getCurrentDay(startDate)
  return Math.ceil(day / 7)
}

export function calculateStreak(streakCalendar: Record<string, boolean>, today: Date = new Date()): {
  current: number
  longest: number
  totalActive: number
} {
  const dates = Object.entries(streakCalendar)
    .filter(([, active]) => active)
    .map(([date]) => startOfDay(parseISO(date)))
    .sort((a, b) => b.getTime() - a.getTime())

  if (dates.length === 0) return { current: 0, longest: 0, totalActive: 0 }

  const todayStart = startOfDay(today)

  // Calculate current streak
  let current = 0
  let checkDate = todayStart

  for (let i = 0; i <= 90; i++) {
    const found = dates.some(d => isSameDay(d, checkDate))
    if (found) {
      current++
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else {
      // Allow 1 day grace (yesterday might not be marked yet)
      if (i === 0) {
        checkDate = new Date(checkDate.getTime() - 86400000)
        continue
      }
      break
    }
  }

  // Calculate longest streak
  let longest = 0
  let tempStreak = 1
  for (let i = 1; i < dates.length; i++) {
    const diffDays = differenceInDays(dates[i - 1], dates[i])
    if (diffDays === 1) {
      tempStreak++
    } else {
      longest = Math.max(longest, tempStreak)
      tempStreak = 1
    }
  }
  longest = Math.max(longest, tempStreak, current)

  return {
    current,
    longest,
    totalActive: dates.length,
  }
}

export function getMotivationalMessage(day: number, streak: number): string {
  if (day === 1) return '🚀 Day 1. The journey of 90 days begins with a single step.'
  if (day === 7) return '🔥 One week locked in. You\'re already ahead of 90% of people.'
  if (day === 14) return '⚡ Two weeks strong. The habit is forming.'
  if (day === 21) return '💪 21 days — science says habits form now. This is yours.'
  if (day === 30) return '🏗️ Day 30. Foundation built. System design fundamentals are yours.'
  if (day === 45) return '🎯 Halfway. Distributed systems? You\'re handling it.'
  if (day === 60) return '🧠 Day 60. Interview mode loading. You can design at scale.'
  if (day === 75) return '⭐ Day 75. Final stretch. Your peers are still on Day 1.'
  if (day === 90) return '🏆 Sysd 90 completed. You are interview-ready.'
  if (streak >= 30) return `🔥 ${streak} day streak! Absolute consistency.`
  if (streak >= 14) return `⚡ ${streak} day streak. This is what elite looks like.`
  if (streak >= 7) return `💪 ${streak} days straight. Keep this going.`
  return `Day ${day} of 90. Stay the course.`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function getMissedDays(startDate: string | null, streakCalendar: Record<string, boolean>): number[] {
  if (!startDate) return []
  const start = parseISO(startDate)
  const today = new Date()
  const totalDays = Math.min(differenceInDays(today, start), 89)
  const missed: number[] = []

  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(start.getTime() + i * 86400000)
    const dateKey = formatDateKey(date)
    if (!streakCalendar[dateKey]) {
      missed.push(i + 1)
    }
  }

  return missed
}
