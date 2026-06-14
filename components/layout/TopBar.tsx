'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { getCurrentDay, getCurrentWeek } from '@/lib/utils/date'
import { format } from 'date-fns'
import { Flame } from 'lucide-react'

interface TopBarProps {
  streak?: number
}

export default function TopBar({ streak = 0 }: TopBarProps) {
  const { profile } = useAuth()
  const today = format(new Date(), 'EEEE, MMMM d')
  const currentDay = getCurrentDay(profile?.start_date ?? null)
  const currentWeek = getCurrentWeek(profile?.start_date ?? null)

  return (
    <header className="h-14 border-b border-[#1e2535] bg-[#0a0b0e]/80 backdrop-blur-sm sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-4">
      {/* Date */}
      <div className="lg:ml-0 ml-12">
        <p className="text-slate-400 text-sm">{today}</p>
      </div>

      {/* Day / Week pills */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="hidden sm:flex items-center gap-1.5 bg-[#161b26] border border-[#1e2535] text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
          Day <span className="text-blue-400 font-bold">{currentDay}</span>/90
        </span>
        <span className="hidden sm:flex items-center gap-1.5 bg-[#161b26] border border-[#1e2535] text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
          Week <span className="text-purple-400 font-bold">{currentWeek}</span>/12
        </span>

        {/* Streak */}
        {streak > 0 && (
          <span className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            {streak}
          </span>
        )}

        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-7 h-7 rounded-full border border-[#1e2535] object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {profile?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
      </div>
    </header>
  )
}
