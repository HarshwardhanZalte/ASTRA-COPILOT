import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { telemetryApi, incidentApi, anomalyApi, systemApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import TelemetryChart from '../components/TelemetryChart'
import { useTelemetry } from '../hooks/useTelemetry'

const SUBSYSTEM_KEYS = ['power', 'thermal', 'communication', 'computing', 'payload']

function SubsystemCard({ name, score }) {
  const status = score >= 0.7 ? 'CRITICAL' : score >= 0.4 ? 'WARNING' : 'NORMAL'
  const pct = Math.round(score * 100)
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0">
      <span className="text-xs font-mono uppercase text-[#94A3B8] w-28">{name}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-1 bg-[#263142]">
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              background: status === 'CRITICAL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#22C55E'
            }}
          />
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

export default function MissionPage() {
  const { telemetry, history } = useTelemetry(120)
  const [incidents, setIncidents] = useState([])
  const [sysStatus, setSysStatus] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, sys] = await Promise.all([
          incidentApi.getAll(),
          systemApi.getStatus()
        ])
        setIncidents(inc.data || [])
        setSysStatus(sys)
      } catch {}
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  const ml = telemetry?.ml || {}
  const subsystem_scores = ml.subsystem_scores || {}
  const overallHealth = Object.values(subsystem_scores).length > 0
    ? Math.round((1 - Math.max(...Object.values(subsystem_scores))) * 100)
    : 100

  const openIncidents = incidents.filter(i => i.status === 'OPEN')

  return (
    <div className="p-4 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">MISSION OPERATIONS / OVERVIEW</div>
          <h1 className="text-lg font-semibold text-[#E5E7EB]">SAT-01 Mission Status</h1>
        </div>
        <div className="flex items-center gap-3">
          {sysStatus?.simulation?.demo_data_loaded && (
            <span className="px-2 py-1 border border-[#38BDF8]/30 text-[9px] font-mono text-[#38BDF8]">
              DEMO HISTORY
            </span>
          )}
          {ml.is_anomaly && (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#EF4444]/40 bg-[#EF4444]/5">
              <AlertTriangle size={12} className="text-[#EF4444]" />
              <span className="text-xs font-mono text-[#EF4444]">ANOMALY ACTIVE</span>
            </div>
          )}
          <div className="text-[10px] font-mono text-[#64748B]">
            {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
          </div>
        </div>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Overall Health */}
        <Panel className="col-span-1">
          <div className="p-4">
            <div className="text-[10px] text-[#64748B] mb-2 tracking-wide">OVERALL HEALTH</div>
            <div className={`text-4xl font-mono font-bold ${
              overallHealth < 60 ? 'text-[#EF4444]'
              : overallHealth < 80 ? 'text-[#F59E0B]'
              : 'text-[#22C55E]'
            }`}>{overallHealth}%</div>
            <div className="mt-2 text-[10px] text-[#64748B]">SAT-01</div>
          </div>
        </Panel>

        {/* Active Incidents */}
        <Panel className="col-span-1">
          <div className="p-4">
            <div className="text-[10px] text-[#64748B] mb-2 tracking-wide">ACTIVE INCIDENTS</div>
            <div className={`text-4xl font-mono font-bold ${
              openIncidents.length > 0 ? 'text-[#F59E0B]' : 'text-[#22C55E]'
            }`}>{openIncidents.length}</div>
            <div className="mt-2 text-[10px] text-[#64748B]">
              {openIncidents.length > 0 ? 'Requires attention' : 'All clear'}
            </div>
          </div>
        </Panel>

        {/* Anomaly Score */}
        <Panel className="col-span-1">
          <div className="p-4">
            <div className="text-[10px] text-[#64748B] mb-2 tracking-wide">ANOMALY SCORE</div>
            <div className={`text-4xl font-mono font-bold ${
              (ml.anomaly_score || 0) >= 0.7 ? 'text-[#EF4444]'
              : (ml.anomaly_score || 0) >= 0.4 ? 'text-[#F59E0B]'
              : 'text-[#22C55E]'
            }`}>{(ml.anomaly_score || 0).toFixed(2)}</div>
            <div className="mt-2">
              {ml.severity ? <StatusBadge status={ml.severity} /> : <span className="text-[10px] text-[#64748B]">NORMAL</span>}
            </div>
          </div>
        </Panel>

        {/* Root Cause */}
        <Panel className="col-span-1">
          <div className="p-4">
            <div className="text-[10px] text-[#64748B] mb-2 tracking-wide">ROOT CAUSE</div>
            {ml.root_cause && ml.is_anomaly ? (
              <>
                <div className="text-sm font-semibold text-[#E5E7EB] leading-tight">{ml.root_cause}</div>
                <div className="mt-2 text-xs font-mono text-[#38BDF8]">
                  {ml.root_cause_confidence ? `${Math.round(ml.root_cause_confidence * 100)}% confidence` : ''}
                </div>
              </>
            ) : (
              <div className="text-sm text-[#64748B]">No active anomaly</div>
            )}
          </div>
        </Panel>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Subsystem Status */}
        <Panel title="SUBSYSTEM STATUS">
          <div className="px-4 py-2">
            {SUBSYSTEM_KEYS.map(name => (
              <SubsystemCard key={name} name={name} score={subsystem_scores[name] || 0} />
            ))}
          </div>
        </Panel>

        {/* Active Incidents Panel */}
        <Panel
          title="ACTIVE INCIDENTS"
          headerRight={
            <Link to="/incidents" className="text-[10px] text-[#38BDF8] hover:underline">View all</Link>
          }
        >
          <div className="p-2">
            {openIncidents.length === 0 && (
              <div className="px-2 py-4 text-xs text-[#64748B]">No active incidents</div>
            )}
            {openIncidents.slice(0, 5).map(inc => (
              <Link
                key={inc.id}
                to={`/incidents/${inc.id}`}
                className="flex items-center justify-between px-2 py-2.5 border-b border-[#1a2332] last:border-0 hover:bg-white/2 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-[#38BDF8]">{inc.incident_number}</span>
                    <StatusBadge status={inc.severity} />
                  </div>
                  <div className="text-xs text-[#94A3B8]">{inc.title}</div>
                </div>
                <ChevronRight size={12} className="text-[#64748B] group-hover:text-[#38BDF8]" />
              </Link>
            ))}
          </div>
        </Panel>

        {/* Telemetry Quick View */}
        <Panel title="POWER SYSTEM">
          <div className="p-3">
            <TelemetryChart data={history} field="battery_voltage" label="Battery Voltage (V)" height={100} />
            <TelemetryChart data={history} field="battery_current" label="Battery Current (A)" height={100} />
          </div>
        </Panel>
      </div>

      {/* Bottom row — more charts */}
      <div className="grid grid-cols-2 gap-3">
        <Panel title="THERMAL & COMPUTING">
          <div className="p-3">
            <TelemetryChart data={history} field="cpu_temperature" label="CPU Temperature (°C)" height={100} />
            <TelemetryChart data={history} field="payload_temperature" label="Payload Temperature (°C)" height={100} />
          </div>
        </Panel>
        <Panel title="COMMUNICATION">
          <div className="p-3">
            <TelemetryChart data={history} field="communication_signal" label="Signal Strength (dBm)" height={100} />
            <TelemetryChart data={history} field="packet_loss" label="Packet Loss (%)" height={100} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
