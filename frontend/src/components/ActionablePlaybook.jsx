import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Play, ShieldAlert, Cpu, Zap, Radio, RefreshCw } from 'lucide-react'

const PLAYBOOK_ACTIONS = [
  {
    id: 'verify_sensor',
    label: 'Cross-Verify Redundant Transducers',
    subsystem: 'COMPUTING',
    icon: Cpu,
    risk: 'LOW RISK',
    riskColor: 'text-hud-emerald border-hud-emerald/30 bg-hud-emerald/10',
    description: 'Poll backup thermistor and voltage telemetry channels to confirm hardware fault vs sensor bias.',
    simulatedResult: 'Telemetry parity verified. Secondary sensor confirms voltage drop is physical anomaly.'
  },
  {
    id: 'shed_load',
    label: 'Inhibit Non-Essential Payload Loads',
    subsystem: 'POWER',
    icon: Zap,
    risk: 'MEDIUM RISK',
    riskColor: 'text-hud-amber border-hud-amber/30 bg-hud-amber/10',
    description: 'Cut primary bus feed to secondary optical sensor to reduce total consumption by 2.4W.',
    simulatedResult: 'Payload load shed executed. Bus current reduced by 1.8A. Battery rate of discharge stabilized.'
  },
  {
    id: 'twta_switch',
    label: 'Switch to Redundant Transponder B',
    subsystem: 'COMMS',
    icon: Radio,
    risk: 'MEDIUM RISK',
    riskColor: 'text-hud-amber border-hud-amber/30 bg-hud-amber/10',
    description: 'Cross-strap RF downlink to backup S-band transponder and reset carrier lock.',
    simulatedResult: 'Transponder B engaged. Carrier lock re-established at -72 dBm. Packet loss dropped to 0.2%.'
  },
  {
    id: 'safe_mode',
    label: 'Transfer Spacecraft to Safe Mode',
    subsystem: 'ALL',
    icon: ShieldAlert,
    risk: 'CRITICAL',
    riskColor: 'text-status-error border-status-error/40 bg-status-error/10',
    description: 'Isolate all science instruments and orient solar panels directly to sun-pointing attitude.',
    simulatedResult: 'SAT-01 transitioned into Safe Mode. Emergency beacon transmitting at 1200 baud.'
  }
]

export default function ActionablePlaybook({ onActionExecuted = null }) {
  const [executingId, setExecutingId] = useState(null)
  const [executedResults, setExecutedResults] = useState({})

  const handleExecute = (action) => {
    setExecutingId(action.id)
    setTimeout(() => {
      setExecutedResults(prev => ({
        ...prev,
        [action.id]: action.simulatedResult
      }))
      setExecutingId(null)
      if (onActionExecuted) onActionExecuted(action)
    }, 1200)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-orbitron font-bold tracking-widest text-text-dim uppercase">
        <span>ACTIONABLE TRIAGE PLAYBOOK</span>
        <span className="text-hud-amber text-[9px]">HUMAN APPROVAL REQUIRED</span>
      </div>

      <div className="space-y-2">
        {PLAYBOOK_ACTIONS.map(action => {
          const Icon = action.icon
          const isDone = Boolean(executedResults[action.id])
          const isBusy = executingId === action.id

          return (
            <div
              key={action.id}
              className="p-3 rounded-xs border border-border/70 bg-bg-panel/50 space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-xs border border-hud-cyan/30 text-hud-cyan bg-hud-cyan/5">
                    <Icon size={12} />
                  </div>
                  <span className="font-bold text-text-primary text-[11px]">{action.label}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-xs ${action.riskColor}`}>
                  {action.risk}
                </span>
              </div>

              <p className="text-[10px] text-text-secondary font-sans leading-snug">
                {action.description}
              </p>

              {isDone ? (
                <div className="p-2 border border-hud-emerald/40 bg-hud-emerald/10 text-hud-emerald text-[10px] rounded-xs flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="flex-shrink-0" />
                  <span>{executedResults[action.id]}</span>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleExecute(action)}
                    disabled={isBusy}
                    className="px-2.5 py-1 text-[10px] font-bold border border-hud-cyan text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 rounded-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" /> EXECUTING...
                      </>
                    ) : (
                      <>
                        <Play size={10} /> APPROVE & EXECUTE
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
