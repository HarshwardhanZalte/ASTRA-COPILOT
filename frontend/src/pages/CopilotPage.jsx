import { useState, useEffect } from 'react'
import { MessageSquare, AlertTriangle, ShieldCheck, Sparkles, Zap, Radio, Cpu, BookOpen, Layers } from 'lucide-react'
import CopilotPanel from '../components/CopilotPanel'
import ActionablePlaybook from '../components/ActionablePlaybook'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import { incidentApi } from '../services/api'
import { useTelemetry } from '../hooks/useTelemetry'

export default function CopilotPage() {
  const { telemetry } = useTelemetry(10)
  const [incidents, setIncidents] = useState([])
  const [selectedIncidentId, setSelectedIncidentId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await incidentApi.getAll()
        const incList = res.data || []
        setIncidents(incList)
        if (incList.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(incList[0].id)
        }
      } catch (e) {
        console.error('Failed to load incidents for Copilot:', e)
      }
    }
    load()
  }, [])

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId)
  const ml = telemetry?.ml || {}

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="text-[10px] tracking-widest text-text-dim font-mono mb-0.5">
            MISSION OPERATIONS • DECISION SUPPORT
          </div>
          <h1 className="text-xl font-orbitron font-bold text-text-primary tracking-wide flex items-center gap-2">
            ASTRA Mission Copilot & Triage Desk
          </h1>
        </div>

        {/* Incident selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-dim">TARGET INCIDENT:</span>
          <select
            value={selectedIncidentId || ''}
            onChange={e => setSelectedIncidentId(e.target.value)}
            className="bg-bg-panel border border-border text-xs font-mono text-text-primary px-3 py-1.5 rounded-xs focus:outline-none focus:border-hud-cyan/70"
          >
            {incidents.map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number} — {inc.title} ({inc.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Copilot Chat Console */}
        <div className="lg:col-span-7 h-[650px]">
          <CopilotPanel incidentId={selectedIncidentId} />
        </div>

        {/* Right Column: Live Context & Actionable Playbook */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Context Card */}
          <Panel title="SELECTED INCIDENT CONTEXT">
            <div className="p-4 space-y-3 font-mono text-xs">
              {selectedIncident ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-hud-cyan">{selectedIncident.incident_number}</span>
                    <StatusBadge status={selectedIncident.severity} />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-dim">INCIDENT TITLE</div>
                    <div className="text-xs font-semibold text-text-primary mt-0.5">
                      {selectedIncident.title}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                    <div>
                      <div className="text-[9px] text-text-dim">ROOT CAUSE</div>
                      <div className="text-[11px] text-text-secondary font-semibold">
                        {selectedIncident.root_cause || 'Analyzing...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-text-dim">DETECTION TIME</div>
                      <div className="text-[11px] text-text-secondary">
                        {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleTimeString('en-US') : 'LIVE'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-text-dim text-center py-4">
                  No incident selected. Copilot will answer in general spacecraft context.
                </div>
              )}
            </div>
          </Panel>

          {/* Actionable Playbook Operations */}
          <Panel title="OPERATIONAL PLAYBOOK">
            <div className="p-4 max-h-[380px] overflow-y-auto">
              <ActionablePlaybook />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
