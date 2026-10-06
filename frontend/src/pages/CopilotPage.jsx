import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Cpu,
  MessageSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import ActionablePlaybook from '../components/ActionablePlaybook'
import CopilotPanel from '../components/CopilotPanel'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import { useTelemetry } from '../hooks/useTelemetry'
import { incidentApi } from '../services/api'

export default function CopilotPage() {
  const { telemetry } = useTelemetry(10)
  const [incidents, setIncidents] = useState([])
  const [selectedIncidentId, setSelectedIncidentId] = useState('')

  useEffect(() => {
    let active = true
    incidentApi.getAll()
      .then(result => {
        if (!active) return
        const incidentList = result.data || []
        setIncidents(incidentList)
        setSelectedIncidentId(current => current || incidentList[0]?.id || '')
      })
      .catch(error => {
        console.error('Failed to load incidents for Copilot:', error)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedIncident = incidents.find(incident => incident.id === selectedIncidentId)
  const ml = telemetry?.ml || {}
  const subsystemScores = ml.subsystem_scores || {}

  return (
    <div className="mx-auto flex min-h-full max-w-[1600px] flex-col space-y-4 p-4">
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-0.5 text-[10px] font-mono tracking-widest text-text-dim">
            MISSION OPERATIONS / DECISION SUPPORT
          </div>
          <h1 className="flex items-center gap-2 text-xl font-orbitron font-bold tracking-wide text-text-primary">
            <MessageSquare size={18} className="text-hud-cyan" />
            ASTRA Mission Copilot & Triage Desk
          </h1>
        </div>

        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap text-[10px] font-mono text-text-dim">TARGET INCIDENT:</span>
          <select
            value={selectedIncidentId}
            onChange={event => setSelectedIncidentId(event.target.value)}
            className="max-w-[min(60vw,420px)] border border-border bg-bg-panel px-3 py-1.5 text-xs font-mono text-text-primary focus:border-hud-cyan/70 focus:outline-none"
          >
            <option value="">No incident — general document search</option>
            {incidents.map(incident => (
              <option key={incident.id} value={incident.id}>
                {incident.incident_number} — {incident.title} ({incident.severity})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid min-h-[min(70dvh,720px)] flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[min(70dvh,720px)] min-h-[440px] lg:col-span-7">
          <CopilotPanel incidentId={selectedIncidentId || null} />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Panel title="SELECTED INCIDENT CONTEXT">
            <div className="space-y-3 p-4 font-mono text-xs">
              {selectedIncident ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-hud-cyan">
                      {selectedIncident.incident_number}
                    </span>
                    <StatusBadge status={selectedIncident.severity} />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-dim">INCIDENT TITLE</div>
                    <div className="mt-0.5 text-xs font-semibold text-text-primary">
                      {selectedIncident.title}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-1">
                    <div>
                      <div className="text-[9px] text-text-dim">ROOT CAUSE</div>
                      <div className="text-[11px] font-semibold text-text-secondary">
                        {selectedIncident.root_cause || 'Analyzing...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-text-dim">DETECTION TIME</div>
                      <div className="text-[11px] text-text-secondary">
                        {selectedIncident.created_at
                          ? new Date(selectedIncident.created_at).toLocaleTimeString('en-US')
                          : 'LIVE'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center text-text-dim">
                  No incident selected. Copilot will search mission documents without incident context.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="LIVE TELEMETRY CONTEXT">
            <div className="grid grid-cols-2 gap-3 p-4 font-mono">
              <ContextMetric icon={Zap} label="BATTERY" value={telemetry?.battery_voltage} unit="V" />
              <ContextMetric icon={AlertTriangle} label="ANOMALY" value={ml.anomaly_score} format="score" />
              <ContextMetric icon={Cpu} label="CPU TEMP" value={telemetry?.cpu_temperature} unit="°C" />
              <ContextMetric icon={Radio} label="SIGNAL" value={telemetry?.communication_signal} unit="dBm" />
            </div>
            <div className="border-t border-border/60 p-3">
              <div className="mb-2 text-[9px] font-orbitron font-bold tracking-widest text-text-dim">
                SUBSYSTEM SCORES
              </div>
              <div className="space-y-1.5">
                {Object.entries(subsystemScores).map(([subsystem, score]) => (
                  <div key={subsystem} className="flex items-center gap-2">
                    <span className="w-20 text-[9px] uppercase text-text-dim">{subsystem}</span>
                    <div className="h-1 flex-1 bg-bg-deep">
                      <div
                        className="h-full bg-hud-cyan"
                        style={{ width: `${Math.round(score * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[9px] text-text-secondary">
                      {score.toFixed(2)}
                    </span>
                  </div>
                ))}
                {Object.keys(subsystemScores).length === 0 && (
                  <div className="text-[10px] text-text-dim">Waiting for telemetry.</div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="OPERATIONAL PLAYBOOK">
            <div className="max-h-[380px] overflow-y-auto p-4">
              <ActionablePlaybook />
            </div>
          </Panel>

          <div className="flex items-center gap-2 border border-hud-emerald/30 bg-hud-emerald/5 px-3 py-2 text-[10px] text-hud-emerald">
            <ShieldCheck size={13} />
            <Sparkles size={12} />
            Decision support only — no spacecraft commands are sent.
          </div>
        </div>
      </div>
    </div>
  )
}

function ContextMetric({ icon: Icon, label, value, unit = '', format }) {
  const displayValue = value == null
    ? '—'
    : format === 'score'
      ? Number(value).toFixed(2)
      : `${Number(value).toFixed(1)} ${unit}`

  return (
    <div className="flex items-center gap-2 border border-border/60 bg-bg-secondary/40 p-2">
      <Icon size={13} className="text-hud-cyan" />
      <div className="min-w-0">
        <div className="text-[8px] text-text-dim">{label}</div>
        <div className="truncate text-[11px] font-bold text-text-primary">{displayValue}</div>
      </div>
    </div>
  )
}
