import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  streak?: number
  /** When true, skip the standard TopBar (e.g. My Orbit has its own header) */
  hideTopBar?: boolean
}

export default function AppShell({ children, streak, hideTopBar }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[#0C0C0C] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!hideTopBar && <TopBar streak={streak} />}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
