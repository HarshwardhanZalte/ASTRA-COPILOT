import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity, Radio, AlertTriangle, MessageSquare,
  FlaskConical, ListTree, Cpu, Settings, ChevronRight
} from 'lucide-react'

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
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B12' }}>
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-[#263142] flex flex-col" style={{ background: '#0D111A' }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#263142]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="3" fill="#38BDF8"/>
                <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="8" stroke="#263142" strokeWidth="1"/>
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-[#38BDF8]" style={{letterSpacing:'0.15em'}}>ASTRA</div>
              <div className="text-[10px] text-[#64748B] tracking-wide">COPILOT</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.group} className="mb-4">
              <div className="px-4 mb-1 text-[10px] font-semibold tracking-widest text-[#64748B]">{group.group}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                      isActive
                        ? 'text-[#38BDF8] border-l-2 border-[#38BDF8] bg-[#38BDF8]/5'
                        : 'text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-white/3 border-l-2 border-transparent'
                    }`
                  }
                >
                  <item.icon size={13} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#263142]">
          <div className="text-[10px] text-[#64748B] font-mono">SAT-01</div>
          <div className="text-[10px] text-[#64748B]">v1.0.0</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
