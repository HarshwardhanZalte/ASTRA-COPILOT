import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, ShieldCheck, Activity, Radio, Cpu, Zap, Thermometer, Database } from 'lucide-react'
import { telemetryApi, incidentApi, anomalyApi, systemApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import TelemetryChart from '../components/TelemetryChart'
import SatelliteVisualizer from '../components/SatelliteVisualizer'
import TimeTravelScrubber from '../components/TimeTravelScrubber'
import { useTelemetry } from '../hooks/useTelemetry'

const SUBSYSTEM_METAS = [
  { key: 'power', name: 'Power System', icon: Zap, nominal: '28.0V • 5.0A' },
  { key: 'thermal', name: 'Thermal Control', icon: Thermometer, nominal: '45.0°C CPU' },
  { key: 'communication', name: 'Comms & RF', icon: Radio, nominal: '-75 dBm' },
  { key: 'computing', name: 'Flight Computer', icon: Cpu, nominal: '35% Load' },
  { key: 'payload', name: 'Payload & Optics', icon: Activity, nominal: '3000 RPM' },
]

function SubsystemCard({ meta, score }) {
  const status = score >= 0.7 ? 'CRITICAL' : score >= 0.4 ? 'WARNING' : 'NORMAL'
  const pct = Math.round(score * 100)
  const Icon = meta.icon

  return (
    <div className="flex items-center justify-between py-2.5 px-3 border-b border-border/50 last:border-0 hover:bg-bg-panel/40 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-xs border ${
          status === 'CRITICAL' ? 'border-status-error/40 bg-status-error/10 text-status-error' :
          status === 'WARNING' ? 'border-hud-amber/40 bg-hud-amber/10 text-hud-amber' :
          'border-hud-cyan/30 bg-hud-cyan/5 text-hud-cyan'
        }`}>
          <Icon size={13} />
        </div>
        <div>
          <div className="text-xs font-mono font-medium text-text-primary uppercase tracking-wide">
            {meta.name}
          </div>
          <div className="text-[10px] font-mono text-text-dim">
            NOM: {meta.nominal}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-24 h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border/60">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.max(5, pct)}%`,
              background: status === 'CRITICAL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#10B981',
              boxShadow: status === 'CRITICAL' ? '0 0 8px #EF4444' : status === 'WARNING' ? '0 0 8px #F59E0B' : '0 0 6px #10B981'
            }}
          />
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

export default function MissionPage() {
  const { telemetry, history, faultInjectedAt } = useTelemetry(120)
  const [incidents, setIncidents] = useState([])
  const [sysStatus, setSysStatus] = useState(null)
  const [selectedFrame, setSelectedFrame] = useState(null)

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

  const activeReading = selectedFrame != null && history[selectedFrame]
    ? history[selectedFrame]
    : telemetry

  const ml = activeReading?.ml || {}
  const subsystem_scores = ml.subsystem_scores || {}
  const maxSubsystemScore = Object.values(subsystem_scores).length > 0
    ? Math.max(...Object.values(subsystem_scores))
    : 0
  const overallHealth = Math.round((1 - maxSubsystemScore) * 100)

  const openIncidents = incidents.filter(i => i.status === 'OPEN')

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <div className="text-[10px] tracking-widest text-text-dim font-mono mb-0.5">
            MISSION OPERATIONS • FLIGHT DECK
          </div>
          <h1 className="text-xl font-orbitron font-bold text-text-primary tracking-wide flex items-center gap-2">
            SAT-01 Telemetry Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {sysStatus?.simulation?.demo_data_loaded && (
            <span className="px-2.5 py-1 border border-hud-cyan/40 bg-hud-cyan/10 text-[9px] font-mono font-bold text-hud-cyan tracking-wider rounded-xs shadow-hud-cyan">
              DEMO HISTORY LOADED
            </span>
          )}
          {ml.is_anomaly ? (
            <div className="flex items-center gap-2 px-3 py-1 border border-status-error/60 bg-status-error/15 rounded-xs animate-pulse">
              <AlertTriangle size={13} className="text-status-error" />
              <span className="text-xs font-mono font-bold text-status-error tracking-wider">
                ANOMALY ACTIVE
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 border border-hud-emerald/40 bg-hud-emerald/10 rounded-xs">
              <ShieldCheck size={13} className="text-hud-emerald" />
              <span className="text-xs font-mono font-bold text-hud-emerald tracking-wider">
                ALL SYSTEMS NOMINAL
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Row: Mission Operations HUD Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall Health */}
        <Panel className="col-span-1" glow={overallHealth < 75}>
          <div className="p-4 relative overflow-hidden">
            <div className="text-[10px] font-orbitron font-bold text-text-dim mb-1 tracking-widest uppercase">
              OVERALL SATELLITE HEALTH
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className={`text-4xl font-orbitron font-extrabold tracking-tight ${
                overallHealth < 60 ? 'text-status-error glow-red-text' :
                overallHealth < 80 ? 'text-hud-amber glow-amber-text' :
                'text-hud-emerald glow-green-text'
              }`}>
                {overallHealth}%
              </div>
              <span className="text-[10px] font-mono text-text-dim">
                {overallHealth >= 80 ? 'OPTIMAL' : overallHealth >= 60 ? 'DEGRADED' : 'CRITICAL'}
              </span>
            </div>
            <div className="w-full bg-bg-secondary h-1 mt-3 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${overallHealth}%`,
                  background: overallHealth < 60 ? '#EF4444' : overallHealth < 80 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
          </div>
        </Panel>

        {/* Active Incidents */}
        <Panel className="col-span-1" glow={openIncidents.length > 0}>
          <div className="p-4">
            <div className="text-[10px] font-orbitron font-bold text-text-dim mb-1 tracking-widest uppercase">
              ACTIVE INCIDENTS
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className={`text-4xl font-orbitron font-extrabold tracking-tight ${
                openIncidents.length > 0 ? 'text-hud-amber glow-amber-text' : 'text-hud-emerald glow-green-text'
              }`}>
                {openIncidents.length}
              </div>
              <span className="text-[10px] font-mono text-text-dim">
                {openIncidents.length > 0 ? 'ATTENTION REQ.' : 'ALL CLEAR'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-text-secondary">
              <span>TOTAL LOGGED:</span>
              <span className="font-bold text-text-primary">{incidents.length}</span>
            </div>
          </div>
        </Panel>

        {/* Anomaly Score */}
        <Panel className="col-span-1" glow={(ml.anomaly_score || 0) >= 0.4}>
          <div className="p-4">
            <div className="text-[10px] font-orbitron font-bold text-text-dim mb-1 tracking-widest uppercase">
              ML ANOMALY SCORE
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className={`text-4xl font-orbitron font-extrabold tracking-tight ${
                (ml.anomaly_score || 0) >= 0.7 ? 'text-status-error glow-red-text' :
                (ml.anomaly_score || 0) >= 0.4 ? 'text-hud-amber glow-amber-text' :
                'text-hud-cyan glow-cyan-text'
              }`}>
                {(ml.anomaly_score || 0).toFixed(2)}
              </div>
              <StatusBadge status={ml.severity || 'NORMAL'} pulse={(ml.anomaly_score || 0) >= 0.7} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-text-dim">
              <span>MODEL:</span>
              <span className="text-hud-cyan">ISOLATION FOREST</span>
            </div>
          </div>
        </Panel>

        {/* Root Cause */}
        <Panel className="col-span-1" glow={Boolean(ml.root_cause && ml.is_anomaly)}>
          <div className="p-4">
            <div className="text-[10px] font-orbitron font-bold text-text-dim mb-1 tracking-widest uppercase">
              ESTIMATED ROOT CAUSE
            </div>
            {ml.root_cause && ml.is_anomaly ? (
              <div className="mt-1">
                <div className="text-sm font-display font-bold text-text-primary leading-tight line-clamp-2">
                  {ml.root_cause}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-text-dim text-[10px]">CONFIDENCE:</span>
                  <span className="text-hud-cyan font-bold">
                    {ml.root_cause_confidence ? `${Math.round(ml.root_cause_confidence * 100)}%` : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs font-mono text-text-dim">
                No active anomalies identified
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* 2D Satellite Schematic Heatmap Section */}
      <SatelliteVisualizer
        subsystemScores={subsystem_scores}
        telemetry={activeReading}
      />

      {/* Middle Row: Subsystems + Active Incidents List + Quick Power Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Subsystem Health Matrix */}
        <Panel title="SUBSYSTEM STATUS MATRIX" className="col-span-1">
          <div className="py-1">
            {SUBSYSTEM_METAS.map(meta => (
              <SubsystemCard
                key={meta.key}
                meta={meta}
                score={subsystem_scores[meta.key] || 0}
              />
            ))}
          </div>
        </Panel>

        {/* Active Incidents List */}
        <Panel
          title="ACTIVE INCIDENT QUEUE"
          className="col-span-1"
          headerRight={
            <Link to="/incidents" className="text-[10px] font-mono text-hud-cyan hover:underline flex items-center gap-1">
              VIEW ALL <ChevronRight size={11} />
            </Link>
          }
        >
          <div className="p-2 space-y-1.5 max-h-[290px] overflow-y-auto">
            {openIncidents.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-text-dim">
                No active incidents in queue. All systems operating normally.
              </div>
            ) : (
              openIncidents.slice(0, 4).map(inc => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xs border border-border/70 bg-bg-panel/40 hover:border-hud-cyan/50 hover:bg-bg-panel/80 transition-all group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-hud-cyan">{inc.incident_number}</span>
                      <StatusBadge status={inc.severity} />
                    </div>
                    <div className="text-xs font-mono text-text-secondary line-clamp-1 group-hover:text-text-primary">
                      {inc.title}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-dim group-hover:text-hud-cyan transition-colors" />
                </Link>
              ))
            )}
          </div>
        </Panel>

        {/* Live Power Subsystem Monitors */}
        <Panel title="POWER SUBSYSTEM TELEMETRY" className="col-span-1">
          <div className="p-3 space-y-3">
            <TelemetryChart
              data={history}
              field="battery_voltage"
              label="Battery Voltage (V)"
              height={110}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
            <TelemetryChart
              data={history}
              field="battery_current"
              label="Battery Current (A)"
              height={110}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
          </div>
        </Panel>
      </div>

      {/* Bottom Row: Additional Subsystem Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel title="THERMAL SUBSYSTEM REAL-TIME MONITOR">
          <div className="p-3 grid grid-cols-2 gap-3">
            <TelemetryChart
              data={history}
              field="cpu_temperature"
              label="CPU Temp (°C)"
              height={115}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
            <TelemetryChart
              data={history}
              field="payload_temperature"
              label="Payload Temp (°C)"
              height={115}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
          </div>
        </Panel>
        <Panel title="COMMUNICATION & RF TELEMETRY MONITOR">
          <div className="p-3 grid grid-cols-2 gap-3">
            <TelemetryChart
              data={history}
              field="communication_signal"
              label="Signal (dBm)"
              height={115}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
            <TelemetryChart
              data={history}
              field="packet_loss"
              label="Packet Loss (%)"
              height={115}
              faultInjectedAt={faultInjectedAt}
              selectedFrame={selectedFrame}
            />
          </div>
        </Panel>
      </div>

      {/* Time-Travel Replay Scrubber */}
      <TimeTravelScrubber
        history={history}
        faultInjectedAt={faultInjectedAt}
        onSelectFrame={setSelectedFrame}
        selectedFrameIndex={selectedFrame}
      />
    </div>
  )
}

