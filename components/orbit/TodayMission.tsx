'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Target, Code2, BookOpen, Zap, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export interface MissionTask {
  type: string
  label: string
  emoji: string
  task: string
  done: boolean
}

interface TodayMissionProps {
  day: number
  week: number
  tasks: MissionTask[]
  onToggle: (taskType: string) => void
  loading?: boolean
}

export default function TodayMission({ day, week, tasks, onToggle, loading }: TodayMissionProps) {
  const completedCount = tasks.filter(t => t.done).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  const allDone = completedCount === tasks.length && tasks.length > 0

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0F0F0F',
        border: '1px solid #1A1A1A',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4" style={{ color: '#E8A838' }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ color: '#F0EDED' }}>
              Today&apos;s Mission
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                background: 'rgba(232,168,56,0.08)',
                border: '1px solid rgba(232,168,56,0.15)',
                color: '#E8A838',
              }}
            >
              Day {day}
            </span>
          </div>
        </div>
        <p className="text-xs" style={{ color: '#3A3A3A' }}>Week {week} / 12</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: '#5C5757' }}>
              {completedCount}/{tasks.length} tasks
            </span>
            <span className="text-xs font-bold" style={{ color: progress === 100 ? '#34d399' : '#E8A838' }}>
              {progress}%
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
            <div
              className="h-full rounded-full transition-all duration-600"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, #34d399, #059669)'
                  : 'linear-gradient(90deg, #E8A838, #D4761C)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 px-4 py-4 space-y-2.5 overflow-y-auto">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: '#161616' }}
              />
            ))}
          </div>
        ) : tasks.map(task => (
          <button
            key={task.type}
            onClick={() => onToggle(task.type)}
            className="w-full text-left rounded-xl transition-all duration-200"
            style={{
              background: task.done ? 'rgba(52,211,153,0.04)' : '#141414',
              border: task.done ? '1px solid rgba(52,211,153,0.15)' : '1px solid #1A1A1A',
              padding: '14px 16px',
            }}
            onMouseEnter={e => {
              if (!task.done) {
                e.currentTarget.style.borderColor = '#2A2A2A'
                e.currentTarget.style.background = '#181818'
              }
            }}
            onMouseLeave={e => {
              if (!task.done) {
                e.currentTarget.style.borderColor = '#1A1A1A'
                e.currentTarget.style.background = '#141414'
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* Check indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {task.done
                  ? <CheckCircle2 className="w-5 h-5" style={{ color: '#34d399' }} />
                  : <Circle className="w-5 h-5" style={{ color: '#2A2A2A' }} />
                }
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-xs font-semibold mb-1 flex items-center gap-1.5"
                  style={{ color: task.done ? '#34d399' : '#5C5757' }}
                >
                  <span>{task.emoji}</span>
                  <span>{task.label}</span>
                </div>
                <div
                  className="text-sm leading-snug"
                  style={{
                    color: task.done ? '#3A3A3A' : '#D4D0D0',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}
                >
                  {task.task}
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* All done state */}
        {allDone && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(52,211,153,0.05)',
              border: '1px solid rgba(52,211,153,0.15)',
            }}
          >
            <div className="text-xl mb-1">🎉</div>
            <p className="text-sm font-semibold" style={{ color: '#34d399' }}>
              Mission complete for today!
            </p>
            <p className="text-xs mt-1" style={{ color: '#5C5757' }}>
              Streak extending soon
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="px-4 pb-4 pt-3 grid grid-cols-3 gap-2"
        style={{ borderTop: '1px solid #1A1A1A' }}
      >
        {[
          { href: '/dsa',   icon: <Code2 className="w-3.5 h-3.5" />,   label: 'Log DSA',   color: '#a78bfa' },
          { href: '/notes', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Add Note',  color: '#60a5fa' },
          { href: '/mocks', icon: <Zap className="w-3.5 h-3.5" />,      label: 'Mock Now',  color: '#34d399' },
        ].map(({ href, icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl transition-all text-center"
            style={{
              background: `${color}0A`,
              border: `1px solid ${color}18`,
              color,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${color}14`
              e.currentTarget.style.borderColor = `${color}28`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${color}0A`
              e.currentTarget.style.borderColor = `${color}18`
            }}
          >
            {icon}
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
