'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard, Map, Calendar, Code2, Server, Mic2,
  StickyNote, BookOpen, FolderGit2, Settings, LogOut,
  Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/* ─── Sidebar collapsed context (shared with AppShell) ─── */
export const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })
export function useSidebarContext() { return useContext(SidebarContext) }

/* ─── Nav structure ─── */
const NAV_GROUPS = [
  {
    label: 'Mission',
    items: [
      { href: '/dashboard', label: 'My Orbit',     icon: LayoutDashboard },
      { href: '/daily',     label: 'Daily Tasks',  icon: Calendar },
    ],
  },
  {
    label: 'Learning',
    items: [
      { href: '/roadmap', label: 'Roadmap',     icon: Map },
      { href: '/dsa',     label: 'DSA Tracker', icon: Code2 },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/case-studies', label: 'Case Studies',    icon: Server },
      { href: '/mocks',        label: 'Mock Interviews', icon: Mic2 },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/notes',     label: 'Notes',     icon: StickyNote },
      { href: '/resources', label: 'Resources', icon: BookOpen },
      { href: '/portfolio', label: 'Portfolio', icon: FolderGit2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

/* ─── Main export ─── */
export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  /* Persist collapsed state */
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  /* ─── Shared inner content ─── */
  const SidebarContent = ({ forMobile = false }: { forMobile?: boolean }) => (
    <div className="flex flex-col h-full relative">

      {/* Brand */}
      <div
        className="flex items-center gap-3 px-3 py-4"
        style={{ borderBottom: '1px solid #1A1A1A' }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center font-black text-[#0C0C0C] flex-shrink-0"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #E8A838, #D4761C)',
            fontSize: 12,
            boxShadow: '0 2px 12px rgba(232,168,56,0.30)',
          }}
        >
          90
        </div>

        {/* Wordmark — hidden when collapsed on desktop */}
        {(forMobile || !collapsed) && (
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight tracking-tight" style={{ color: '#F0EDED' }}>
              Orbit90
            </div>
            <div className="text-[10px] tracking-widest font-mono" style={{ color: '#3A3A3A' }}>
              90-DAY PROTOCOL
            </div>
          </div>
        )}

        {/* Desktop collapse toggle */}
        {!forMobile && (
          <button
            onClick={toggleCollapsed}
            className="ml-auto p-1 rounded-lg transition-colors flex-shrink-0"
            style={{ color: '#3A3A3A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9A9494')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {/* Group label — only when expanded */}
            {(forMobile || !collapsed) && (
              <div
                className="px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: '#3A3A3A' }}
              >
                {group.label}
              </div>
            )}
            {/* Collapsed group divider */}
            {!forMobile && collapsed && (
              <div className="w-6 h-px mx-auto mb-2" style={{ background: '#1F1F1F' }} />
            )}

            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    title={!forMobile && collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                      collapsed && !forMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                      isActive
                        ? 'text-[#0C0C0C]'
                        : 'text-[#5C5757] hover:text-[#F0EDED]'
                    )}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #E8A838, #D4761C)',
                      boxShadow: '0 2px 10px rgba(232,168,56,0.18)',
                    } : undefined}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? 'text-[#0C0C0C]' : 'text-[#5C5757] group-hover:text-[#9A9494]'
                      )}
                    />
                    {(forMobile || !collapsed) && (
                      <span className="truncate">{label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 pt-2" style={{ borderTop: '1px solid #1A1A1A' }}>
        <button
          onClick={handleSignOut}
          title={!forMobile && collapsed ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 w-full',
            collapsed && !forMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          )}
          style={{ color: '#3A3A3A' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f87171'
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#3A3A3A'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(forMobile || !collapsed) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 60 : 220,
          background: '#0A0A0A',
          borderRight: '1px solid #1A1A1A',
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <SidebarContent forMobile={false} />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: '#111111', border: '1px solid #1F1F1F', color: '#9A9494' }}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.70)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen transition-transform duration-300 lg:hidden',
        )}
        style={{
          width: 220,
          background: '#0A0A0A',
          borderRight: '1px solid #1A1A1A',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <SidebarContent forMobile={true} />
      </aside>
    </SidebarContext.Provider>
  )
}
