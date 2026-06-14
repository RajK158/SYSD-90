'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import { Settings, Calendar, RotateCcw, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth()
  const supabase = createClient()
  const [startDate, setStartDate] = useState('')
  const [flexibleMode, setFlexibleMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (profile) {
      setStartDate(profile.start_date ?? '')
      setFlexibleMode(profile.flexible_mode)
    }
  }, [profile])

  async function saveSettings() {
    setSaving(true)
    await updateProfile({ start_date: startDate || null, flexible_mode: flexibleMode })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function resetProgress() {
    const confirmed = confirm(
      'Are you sure you want to RESET ALL PROGRESS?\n\nThis will permanently delete:\n• All task completions\n• Your streak history\n• All DSA problems\n• All case study progress\n• All notes\n• All mock interview logs\n\nThis cannot be undone.'
    )
    if (!confirmed) return

    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setResetting(false); return }

    // Delete all user data
    await Promise.all([
      supabase.from('task_completions').delete().eq('user_id', user.id),
      supabase.from('custom_tasks').delete().eq('user_id', user.id),
      supabase.from('dsa_problems').delete().eq('user_id', user.id),
      supabase.from('case_study_progress').delete().eq('user_id', user.id),
      supabase.from('mock_interviews').delete().eq('user_id', user.id),
      supabase.from('notes').delete().eq('user_id', user.id),
      supabase.from('resources_status').delete().eq('user_id', user.id),
      supabase.from('portfolio_progress').delete().eq('user_id', user.id),
      supabase.from('weekly_reviews').delete().eq('user_id', user.id),
      supabase.from('streaks').delete().eq('user_id', user.id),
    ])

    await updateProfile({ start_date: null })
    setResetting(false)
    window.location.href = '/dashboard'
  }

  async function exportData() {
    setExporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setExporting(false); return }

    const [
      { data: tasks },
      { data: dsa },
      { data: caseStudies },
      { data: mocks },
      { data: notes },
      { data: resources },
      { data: portfolio },
      { data: streak },
      { data: reviews },
    ] = await Promise.all([
      supabase.from('task_completions').select('*').eq('user_id', user.id),
      supabase.from('dsa_problems').select('*').eq('user_id', user.id),
      supabase.from('case_study_progress').select('*').eq('user_id', user.id),
      supabase.from('mock_interviews').select('*').eq('user_id', user.id),
      supabase.from('notes').select('*').eq('user_id', user.id),
      supabase.from('resources_status').select('*').eq('user_id', user.id),
      supabase.from('portfolio_progress').select('*').eq('user_id', user.id),
      supabase.from('streaks').select('*').eq('user_id', user.id),
      supabase.from('weekly_reviews').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      tasks,
      dsa,
      caseStudies,
      mocks,
      notes,
      resources,
      portfolio,
      streak,
      reviews,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sysd90-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = confirm('Import data? This will merge with your existing data (not replace it).')
    if (!confirmed) return

    const text = await file.text()
    const data = JSON.parse(text)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Import DSA problems
    if (data.dsa?.length) {
      const toInsert = data.dsa.map((p: Record<string, unknown>) => ({ ...p, user_id: user.id, id: undefined }))
      await supabase.from('dsa_problems').insert(toInsert)
    }

    // Import notes
    if (data.notes?.length) {
      const toInsert = data.notes.map((n: Record<string, unknown>) => ({ ...n, user_id: user.id, id: undefined }))
      await supabase.from('notes').insert(toInsert)
    }

    alert('Import complete! Refresh the page to see your data.')
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your 90-day journey preferences</p>
        </div>

        {/* Journey Settings */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Journey Settings
          </h2>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Day 1 Start Date
            </label>
            <p className="text-xs text-slate-500 mb-3">This determines which day you&apos;re on in the 90-day roadmap.</p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-[#161b26] border border-[#1e2535] focus:border-blue-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>

          <div className="flex items-start justify-between pt-2 border-t border-[#1e2535]">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">Flexible Mode (Catch-Up)</div>
              <p className="text-xs text-slate-500">If you miss days, shows a recovery plan instead of punishing your streak.</p>
            </div>
            <button
              onClick={() => setFlexibleMode(!flexibleMode)}
              className={`w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 relative mt-1 ${flexibleMode ? 'bg-blue-600' : 'bg-[#1e2535]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${flexibleMode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">Data Management</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={exportData}
              disabled={exporting}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
            </button>

            <label className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Data (JSON)
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>

          <p className="text-xs text-slate-500">Export creates a full backup of your journey. Import merges data without overwriting.</p>
        </div>

        {/* Account Info */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-2xl p-6 space-y-3">
          <h2 className="font-bold text-white">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Username</span>
              <span className="text-slate-300">{profile?.username ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member since</span>
              <span className="text-slate-300">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Streak freezes remaining</span>
              <span className="text-slate-300">{profile?.streak_freeze_count ?? 3}</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <h2 className="font-bold text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h2>
          <p className="text-slate-400 text-sm mb-4">This will permanently delete all your progress, notes, DSA logs, and streak data. This cannot be undone.</p>
          <button
            onClick={resetProgress}
            disabled={resetting}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {resetting ? 'Resetting...' : 'Reset All Progress'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
