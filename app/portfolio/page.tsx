'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import { FolderGit2, CheckCircle2, Circle, ExternalLink, Github } from 'lucide-react'
import type { PortfolioFolder, PortfolioItem } from '@/lib/types'

const PORTFOLIO_FOLDERS: { key: PortfolioFolder; title: string; icon: string; description: string }[] = [
  { key: 'url-shortener', title: 'URL Shortener', icon: '🔗', description: 'Bitly-style URL shortening service design' },
  { key: 'social-feed', title: 'Social Feed', icon: '📱', description: 'Instagram/Twitter feed with fanout' },
  { key: 'chat-system', title: 'Chat System', icon: '💬', description: 'WhatsApp/Slack real-time messaging' },
  { key: 'video-platform', title: 'Video Platform', icon: '🎥', description: 'YouTube/Netflix video streaming' },
  { key: 'rate-limiter', title: 'Rate Limiter', icon: '🚦', description: 'Distributed rate limiting system' },
  { key: 'notification-system', title: 'Notification System', icon: '🔔', description: 'Multi-channel notification service' },
  { key: 'payment-system', title: 'Payment System', icon: '💳', description: 'Stripe-style payment processing' },
  { key: 'dsa-solutions', title: 'DSA Solutions', icon: '💻', description: 'Organized LeetCode solutions by pattern' },
]

const PORTFOLIO_ITEMS: { key: PortfolioItem; label: string }[] = [
  { key: 'readme', label: 'README.md' },
  { key: 'diagram', label: 'Architecture Diagram' },
  { key: 'api_design', label: 'API Design' },
  { key: 'database_schema', label: 'Database Schema' },
  { key: 'trade_offs', label: 'Trade-offs Document' },
  { key: 'scaling_plan', label: 'Scaling Plan' },
]

type ProgressData = Record<string, Record<string, { completed: boolean; github_link: string }>>

export default function PortfolioPage() {
  const supabase = createClient()
  const [progressData, setProgressData] = useState<ProgressData>({})
  const [loading, setLoading] = useState(true)
  const [editingLink, setEditingLink] = useState<string | null>(null)
  const [linkText, setLinkText] = useState('')

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('portfolio_progress')
      .select('*')
      .eq('user_id', user.id)

    if (data) {
      const map: ProgressData = {}
      data.forEach(d => {
        if (!map[d.folder_key]) map[d.folder_key] = {}
        map[d.folder_key][d.item_key] = {
          completed: d.completed,
          github_link: d.github_link ?? '',
        }
      })
      setProgressData(map)
    }
    setLoading(false)
  }

  async function toggleItem(folder: PortfolioFolder, item: PortfolioItem) {
    const current = progressData[folder]?.[item]
    const newVal = !current?.completed

    setProgressData(prev => ({
      ...prev,
      [folder]: {
        ...(prev[folder] ?? {}),
        [item]: { ...(prev[folder]?.[item] ?? { github_link: '' }), completed: newVal },
      },
    }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('portfolio_progress').upsert({
      user_id: user.id,
      folder_key: folder,
      item_key: item,
      completed: newVal,
      github_link: current?.github_link ?? null,
    }, { onConflict: 'user_id,folder_key,item_key' })
  }

  async function saveLink(folder: string, item: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setProgressData(prev => ({
      ...prev,
      [folder]: {
        ...(prev[folder] ?? {}),
        [item]: { ...(prev[folder]?.[item] ?? { completed: false }), github_link: linkText },
      },
    }))

    await supabase.from('portfolio_progress').upsert({
      user_id: user.id,
      folder_key: folder,
      item_key: item,
      completed: progressData[folder]?.[item]?.completed ?? false,
      github_link: linkText || null,
    }, { onConflict: 'user_id,folder_key,item_key' })

    setEditingLink(null)
  }

  function getFolderProgress(folder: PortfolioFolder) {
    const data = progressData[folder] ?? {}
    const done = Object.values(data).filter(v => v.completed).length
    return { done, total: PORTFOLIO_ITEMS.length, pct: Math.round((done / PORTFOLIO_ITEMS.length) * 100) }
  }

  const totalItems = PORTFOLIO_FOLDERS.length * PORTFOLIO_ITEMS.length
  const completedItems = Object.values(progressData).reduce((acc, folder) =>
    acc + Object.values(folder).filter(v => v.completed).length, 0
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-emerald-400" />
            GitHub Portfolio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">system-design-interview-prep</code> GitHub repository
          </p>
        </div>

        {/* CTA to create repo */}
        <div className="bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white text-sm mb-1">Create your public portfolio repo</p>
            <p className="text-slate-400 text-xs">A public GitHub repo showcasing your system design work makes a strong impression on interviewers.</p>
          </div>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-600/40 text-emerald-400 font-semibold px-4 py-2 rounded-xl transition-all text-sm flex-shrink-0"
          >
            <Github className="w-4 h-4" />
            Create Repo
          </a>
        </div>

        {/* Overall progress */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Portfolio Completion</span>
            <span className="text-sm font-bold text-emerald-400">{completedItems}/{totalItems} items</span>
          </div>
          <div className="h-2 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((completedItems / totalItems) * 100)}%` }}
            />
          </div>
        </div>

        {/* Folders */}
        <div className="grid sm:grid-cols-2 gap-4">
          {PORTFOLIO_FOLDERS.map(folder => {
            const progress = getFolderProgress(folder.key)
            const folderData = progressData[folder.key] ?? {}

            return (
              <div key={folder.key} className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{folder.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm">{folder.title}</h3>
                    <p className="text-slate-500 text-xs truncate">{folder.description}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex-shrink-0">{progress.done}/{progress.total}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-[#1e2535] rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {PORTFOLIO_ITEMS.map(item => {
                    const itemData = folderData[item.key]
                    const done = itemData?.completed ?? false
                    const link = itemData?.github_link ?? ''
                    const editKey = `${folder.key}-${item.key}`
                    const isEditing = editingLink === editKey

                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        <button onClick={() => toggleItem(folder.key, item.key as PortfolioItem)}>
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400 transition-colors" />
                          }
                        </button>
                        <span className={`text-xs flex-1 ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          {item.label}
                        </span>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={linkText}
                              onChange={e => setLinkText(e.target.value)}
                              placeholder="GitHub URL..."
                              className="bg-[#161b26] border border-[#1e2535] text-white rounded px-2 py-0.5 text-[10px] outline-none w-32 focus:border-emerald-500"
                            />
                            <button onClick={() => saveLink(folder.key, item.key)} className="text-[10px] text-emerald-400">Save</button>
                            <button onClick={() => setEditingLink(null)} className="text-[10px] text-slate-500">✕</button>
                          </div>
                        ) : link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-emerald-400 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => { setEditingLink(editKey); setLinkText('') }}
                            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            + link
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
