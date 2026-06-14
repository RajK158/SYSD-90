'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import { CASE_STUDIES, CASE_STUDY_SECTIONS } from '@/lib/data/caseStudies'
import { Server, CheckCircle2, Circle, ChevronRight, ExternalLink, Github, StickyNote, X, ArrowLeft } from 'lucide-react'
import type { CaseStudyKey, CaseStudySectionKey } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

type ProgressMap = Record<string, Record<string, { completed: boolean; notes: string; diagram_link: string; github_link: string }>>

export default function CaseStudiesPage() {
  const supabase = createClient()
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [selectedStudy, setSelectedStudy] = useState<CaseStudyKey | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionForm, setSectionForm] = useState({ notes: '', diagram_link: '', github_link: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('case_study_progress')
      .select('*')
      .eq('user_id', user.id)

    if (data) {
      const map: ProgressMap = {}
      data.forEach(d => {
        if (!map[d.case_study_key]) map[d.case_study_key] = {}
        map[d.case_study_key][d.section_key] = {
          completed: d.completed,
          notes: d.notes ?? '',
          diagram_link: d.diagram_link ?? '',
          github_link: d.github_link ?? '',
        }
      })
      setProgressMap(map)
    }
    setLoading(false)
  }

  async function toggleSection(studyKey: CaseStudyKey, sectionKey: CaseStudySectionKey) {
    const current = progressMap[studyKey]?.[sectionKey]
    const newVal = !current?.completed

    setProgressMap(prev => ({
      ...prev,
      [studyKey]: {
        ...(prev[studyKey] ?? {}),
        [sectionKey]: {
          ...(prev[studyKey]?.[sectionKey] ?? { notes: '', diagram_link: '', github_link: '' }),
          completed: newVal,
        },
      },
    }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('case_study_progress').upsert({
      user_id: user.id,
      case_study_key: studyKey,
      section_key: sectionKey,
      completed: newVal,
      notes: current?.notes ?? null,
      diagram_link: current?.diagram_link ?? null,
      github_link: current?.github_link ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,case_study_key,section_key' })
  }

  async function saveLinks(studyKey: CaseStudyKey, sectionKey: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setProgressMap(prev => ({
      ...prev,
      [studyKey]: {
        ...(prev[studyKey] ?? {}),
        [sectionKey]: {
          ...(prev[studyKey]?.[sectionKey] ?? { completed: false }),
          notes: sectionForm.notes,
          diagram_link: sectionForm.diagram_link,
          github_link: sectionForm.github_link,
        },
      },
    }))

    await supabase.from('case_study_progress').upsert({
      user_id: user.id,
      case_study_key: studyKey,
      section_key: sectionKey,
      completed: progressMap[studyKey]?.[sectionKey]?.completed ?? false,
      notes: sectionForm.notes || null,
      diagram_link: sectionForm.diagram_link || null,
      github_link: sectionForm.github_link || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,case_study_key,section_key' })

    setEditingSection(null)
  }

  function getCaseStudyProgress(key: CaseStudyKey) {
    const data = progressMap[key] ?? {}
    const done = Object.values(data).filter(v => v.completed).length
    return { done, total: CASE_STUDY_SECTIONS.length, pct: Math.round((done / CASE_STUDY_SECTIONS.length) * 100) }
  }

  const totalSections = CASE_STUDIES.length * CASE_STUDY_SECTIONS.length
  const completedSections = Object.values(progressMap).reduce((acc, studyProgress) =>
    acc + Object.values(studyProgress).filter(v => v.completed).length, 0
  )

  // Detail view
  if (selectedStudy) {
    const study = CASE_STUDIES.find(s => s.key === selectedStudy)!
    const progress = getCaseStudyProgress(selectedStudy)
    const studyProgress = progressMap[selectedStudy] ?? {}

    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStudy(null)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Case Studies
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{study.icon}</span>
                <div>
                  <h1 className="text-2xl font-black text-white">{study.title}</h1>
                  <p className="text-slate-400 text-sm mt-0.5">{study.description}</p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black text-emerald-400">{progress.pct}%</div>
              <div className="text-slate-500 text-xs">{progress.done}/{progress.total} sections</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${progress.pct}%` }}
            />
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {CASE_STUDY_SECTIONS.map((section) => {
              const sectionData = studyProgress[section.key]
              const isDone = sectionData?.completed ?? false
              const isEditing = editingSection === section.key

              return (
                <div
                  key={section.key}
                  className={cn(
                    'bg-[#0f1117] border rounded-2xl overflow-hidden transition-all',
                    isDone ? 'border-emerald-500/20' : 'border-[#1e2535]'
                  )}
                >
                  <div className="flex items-start gap-4 p-4">
                    <button
                      onClick={() => toggleSection(selectedStudy, section.key as CaseStudySectionKey)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {isDone
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        : <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold mb-0.5 text-sm ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                        {section.title}
                      </div>
                      <div className="text-slate-500 text-xs">{section.description}</div>

                      {/* Links and notes */}
                      {(sectionData?.notes || sectionData?.diagram_link || sectionData?.github_link) && !isEditing && (
                        <div className="mt-2 space-y-1">
                          {sectionData.notes && <p className="text-xs text-slate-400">{sectionData.notes}</p>}
                          <div className="flex gap-3">
                            {sectionData.diagram_link && (
                              <a href={sectionData.diagram_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Diagram
                              </a>
                            )}
                            {sectionData.github_link && (
                              <a href={sectionData.github_link} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                                <Github className="w-3 h-3" /> GitHub
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={sectionForm.notes}
                            onChange={e => setSectionForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes for this section..."
                            rows={2}
                            className="w-full bg-[#161b26] border border-[#1e2535] text-white rounded-xl px-3 py-2 text-xs outline-none resize-none focus:border-emerald-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={sectionForm.diagram_link}
                              onChange={e => setSectionForm(prev => ({ ...prev, diagram_link: e.target.value }))}
                              placeholder="Diagram link (excalidraw...)"
                              className="bg-[#161b26] border border-[#1e2535] text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                            />
                            <input
                              value={sectionForm.github_link}
                              onChange={e => setSectionForm(prev => ({ ...prev, github_link: e.target.value }))}
                              placeholder="GitHub link"
                              className="bg-[#161b26] border border-[#1e2535] text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveLinks(selectedStudy, section.key)} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg">Save</button>
                            <button onClick={() => setEditingSection(null)} className="text-xs text-slate-500 px-3 py-1 rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingSection(section.key)
                          setSectionForm({
                            notes: sectionData?.notes ?? '',
                            diagram_link: sectionData?.diagram_link ?? '',
                            github_link: sectionData?.github_link ?? '',
                          })
                        }}
                        className="flex-shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </AppShell>
    )
  }

  // Grid view
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-400" />
            System Design Case Studies
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {completedSections}/{totalSections} sections completed across {CASE_STUDIES.length} case studies
          </p>
        </div>

        {/* Overall progress */}
        <div className="bg-[#0f1117] border border-[#1e2535] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Overall Progress</span>
            <span className="text-sm font-bold text-cyan-400">{Math.round((completedSections / totalSections) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((completedSections / totalSections) * 100)}%` }}
            />
          </div>
        </div>

        {/* Case study grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CASE_STUDIES.map(study => {
            const progress = getCaseStudyProgress(study.key)
            const isComplete = progress.pct === 100

            return (
              <button
                key={study.key}
                onClick={() => setSelectedStudy(study.key)}
                className={cn(
                  'bg-[#0f1117] border rounded-2xl p-5 text-left transition-all duration-200 card-hover group',
                  isComplete ? 'border-emerald-500/30' : 'border-[#1e2535] hover:border-[#2d3748]'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{study.icon}</span>
                  <div className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300 transition-colors">
                    <span className="text-xs">{progress.done}/{progress.total}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-white mb-1">{study.title}</h3>
                <p className="text-slate-500 text-xs mb-4 line-clamp-2">{study.description}</p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className={`text-xs font-bold ${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>{progress.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-slate-600">Week {study.week}</div>
              </button>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
