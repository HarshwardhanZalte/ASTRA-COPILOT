import { NavLink } from 'react-router-dom'
import {
  Activity, Radio, AlertTriangle, MessageSquare,
  FlaskConical, ListTree, Cpu, Settings
} from 'lucide-react'
import TopStatusBar from '../components/TopStatusBar'

const NAV = [
  {
    group: 'MISSION',
    items: [
      { to: '/mission', label: 'Overview', icon: Activity },
      { to: '/telemetry', label: 'Telemetry', icon: Radio },
      { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
      { to: '/copilot', label: 'Copilot', icon: MessageSquare },
    ]
  },
  {
    group: 'SIMULATION',
    items: [
      { to: '/simulator', label: 'Anomaly Simulator', icon: FlaskConical },
      { to: '/scenarios', label: 'Scenarios', icon: ListTree },
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { to: '/model-status', label: 'Model Status', icon: Cpu },
      { to: '/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-deep text-text-primary">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-bg-primary/95 flex flex-col z-30">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border bg-bg-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs border border-hud-cyan/40 bg-hud-cyan/10 flex items-center justify-center shadow-hud-cyan">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="3" fill="#00F0FF" />
                <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="8" stroke="#1E293B" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-orbitron font-extrabold tracking-widest text-hud-cyan glow-cyan-text">
                ASTRA
              </div>
              <div className="text-[9px] font-mono text-text-dim tracking-widest uppercase">
                MISSION COPILOT
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[9px] font-orbitron font-bold tracking-widest text-text-dim/80 uppercase">
                {group.group}
              </div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-xs transition-all duration-150 ${
                      isActive
                        ? 'text-hud-cyan bg-hud-cyan/10 border-l-2 border-hud-cyan shadow-[inset_0_0_12px_rgba(0,240,255,0.1)] font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel/60 border-l-2 border-transparent'
                    }`
                  }
                >
                  <item.icon size={14} className="flex-shrink-0" />
                  <span className="tracking-wide">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-bg-secondary/30 text-[10px] font-mono flex items-center justify-between text-text-dim">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-emerald shadow-[0_0_4px_#10B981]" />
            <span>SYS: ONLINE</span>
          </div>
          <span>v1.2.0</span>
        </div>
      </aside>

      {/* Main View Area with TopStatusBar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopStatusBar />
        <main className="flex-1 overflow-auto bg-bg-deep/70 relative">
          {children}
        </main>
      </div>
    </div>
  )
}

