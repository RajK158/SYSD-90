import { ReadinessTier } from '@/lib/types'

interface ReadinessInput {
  dsaSolved: number
  caseStudySectionsCompleted: number
  mocksCompleted: number
  currentStreak: number
  weeklyReviewsCompleted: number
}

export function calculateReadinessScore(input: ReadinessInput): {
  score: number
  tier: ReadinessTier
  breakdown: { label: string; earned: number; max: number }[]
} {
  const dsaMax = 30
  const caseStudyMax = 25
  const mockMax = 20
  const streakMax = 15
  const reviewMax = 10

  const dsaEarned = Math.min((input.dsaSolved / 150) * dsaMax, dsaMax)
  const caseStudyEarned = Math.min((input.caseStudySectionsCompleted / 144) * caseStudyMax, caseStudyMax)
  const mockEarned = Math.min((input.mocksCompleted / 10) * mockMax, mockMax)
  const streakEarned = Math.min((input.currentStreak / 90) * streakMax, streakMax)
  const reviewEarned = Math.min((input.weeklyReviewsCompleted / 12) * reviewMax, reviewMax)

  const score = Math.round(dsaEarned + caseStudyEarned + mockEarned + streakEarned + reviewEarned)

  let tier: ReadinessTier
  if (score <= 20) tier = 'Beginner'
  else if (score <= 40) tier = 'Building'
  else if (score <= 60) tier = 'Consistent'
  else if (score <= 80) tier = 'Interview-Ready'
  else tier = 'Peak Mode'

  return {
    score,
    tier,
    breakdown: [
      { label: 'DSA Solved (150)', earned: Math.round(dsaEarned), max: dsaMax },
      { label: 'Case Study Sections (144)', earned: Math.round(caseStudyEarned), max: caseStudyMax },
      { label: 'Mock Interviews (10)', earned: Math.round(mockEarned), max: mockMax },
      { label: 'Current Streak (90)', earned: Math.round(streakEarned), max: streakMax },
      { label: 'Weekly Reviews (12)', earned: Math.round(reviewEarned), max: reviewMax },
    ],
  }
}

export const TIER_COLORS: Record<ReadinessTier, string> = {
  'Beginner': 'text-slate-400',
  'Building': 'text-blue-400',
  'Consistent': 'text-cyan-400',
  'Interview-Ready': 'text-purple-400',
  'Peak Mode': 'text-emerald-400',
}

export const TIER_BG: Record<ReadinessTier, string> = {
  'Beginner': 'bg-slate-500/20 border-slate-500/30',
  'Building': 'bg-blue-500/20 border-blue-500/30',
  'Consistent': 'bg-cyan-500/20 border-cyan-500/30',
  'Interview-Ready': 'bg-purple-500/20 border-purple-500/30',
  'Peak Mode': 'bg-emerald-500/20 border-emerald-500/30',
}

export const TIER_EMOJI: Record<ReadinessTier, string> = {
  'Beginner': '🌱',
  'Building': '🔨',
  'Consistent': '⚡',
  'Interview-Ready': '🎯',
  'Peak Mode': '🚀',
}
