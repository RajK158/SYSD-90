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
    <header
      className="h-14 sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-4 backdrop-blur-sm"
      style={{ borderBottom: '1px solid #1F1F1F', background: 'rgba(12,12,12,0.90)' }}
    >
      {/* Date */}
      <div className="lg:ml-0 ml-12">
        <p className="text-sm font-medium" style={{ color: '#5C5757' }}>{today}</p>
      </div>

      {/* Day / Week pills */}
      <div className="flex items-center gap-2 ml-auto">
        <span
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: '#161616', border: '1px solid #1F1F1F', color: '#9A9494' }}
        >
          Day <span className="font-bold" style={{ color: '#E8A838' }}>{currentDay}</span>/90
        </span>
        <span
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: '#161616', border: '1px solid #1F1F1F', color: '#9A9494' }}
        >
          Week <span className="font-bold" style={{ color: '#E8A838' }}>{currentWeek}</span>/12
        </span>

        {/* Streak */}
        {streak > 0 && (
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(232,168,56,0.10)', border: '1px solid rgba(232,168,56,0.20)', color: '#E8A838' }}
          >
            <Flame className="w-3.5 h-3.5" />
            {streak}
          </span>
        )}

        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover"
            style={{ border: '1px solid #1F1F1F' }}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#0C0C0C] text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #E8A838, #D4761C)' }}
          >
            {profile?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
      </div>
    </header>
  )
}
