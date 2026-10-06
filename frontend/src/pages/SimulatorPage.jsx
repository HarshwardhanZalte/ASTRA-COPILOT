import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Zap, X } from 'lucide-react'
import { useTelemetry } from '../hooks/useTelemetry'
import { useSimulator } from '../hooks/useSimulator'
import TelemetryChart from '../components/TelemetryChart'
import StatusBadge from '../components/StatusBadge'
import Panel from '../components/Panel'

const SCENARIOS = [
  { id: 'none', label: 'Normal Mission', fault: null },
  { id: 'battery_degradation', label: 'Battery Degradation', fault: 'battery_degradation' },
  { id: 'thermal_runaway', label: 'Thermal Runaway', fault: 'thermal_runaway' },
  { id: 'communication_failure', label: 'Communication Failure', fault: 'communication_failure' },
  { id: 'sensor_drift', label: 'Sensor Drift', fault: 'sensor_drift' },
]

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const TELEMETRY_PARAMS = [
  { field: 'battery_voltage', label: 'Battery Voltage', unit: 'V' },
  { field: 'battery_current', label: 'Battery Current', unit: 'A' },
  { field: 'battery_temperature', label: 'Battery Temp', unit: '°C' },
  { field: 'solar_power', label: 'Solar Power', unit: 'kW' },
  { field: 'power_consumption', label: 'Power Consumption', unit: 'W' },
  { field: 'cpu_temperature', label: 'CPU Temperature', unit: '°C' },
  { field: 'cpu_load', label: 'CPU Load', unit: '%' },
  { field: 'memory_usage', label: 'Memory Usage', unit: '%' },
  { field: 'communication_signal', label: 'Signal Strength', unit: 'dBm' },
  { field: 'packet_loss', label: 'Packet Loss', unit: '%' },
  { field: 'communication_latency', label: 'Comm Latency', unit: 'ms' },
  { field: 'payload_temperature', label: 'Payload Temp', unit: '°C' },
  { field: 'reaction_wheel_speed', label: 'Reaction Wheel', unit: 'RPM' },
]

const CHART_FIELDS = [
  { field: 'battery_voltage', label: 'Battery Voltage (V)' },
  { field: 'battery_current', label: 'Battery Current (A)' },
  { field: 'battery_temperature', label: 'Battery Temp (°C)' },
  { field: 'solar_power', label: 'Solar Power (kW)' },
  { field: 'cpu_temperature', label: 'CPU Temp (°C)' },
  { field: 'communication_signal', label: 'Signal (dBm)' },
]

export default function SimulatorPage() {
  const { telemetry, history, connected, faultInjectedAt, markFaultInjection } = useTelemetry(200)
  const { status, events, loading, start, pause, reset, injectFault, clearFault, setConditions } = useSimulator()

  const [selectedScenario, setSelectedScenario] = useState('none')
  const [severity, setSeverity] = useState('HIGH')
  const [conditions, setConditionsState] = useState({
    noise_enabled: false,
    missing_enabled: false,
    delay_enabled: false,
    outlier_enabled: false,
  })

  const eventLogRef = useRef(null)

  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight
    }
  }, [events])

  const handleInjectFault = async () => {
    if (selectedScenario === 'none') return
    markFaultInjection()
    await injectFault(selectedScenario, severity)
  }

  const handleConditionToggle = async (key) => {
    const updated = { ...conditions, [`${key}_enabled`]: !conditions[`${key}_enabled`] }
    setConditionsState(updated)
    await setConditions(updated)
  }

  const ml = telemetry?.ml || {}
  const statuses = telemetry?.statuses || {}
  const isRunning = status?.running

  return (
    <div className="flex flex-col h-full bg-bg-deep">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-bg-primary/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] tracking-widest text-text-dim font-mono mb-0.5">
              ASTRA SIMULATION ENGINE • HARDWARE-IN-THE-LOOP
            </div>
            <div className="text-sm font-orbitron font-bold text-text-primary flex items-center gap-2">
              SAT-01 Fault Injector
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status?.demo_data_loaded && (
              <span className="px-2 py-0.5 border border-hud-cyan/40 bg-hud-cyan/10 text-[9px] font-mono text-hud-cyan font-bold rounded-xs shadow-hud-cyan">
                DEMO HISTORY
              </span>
            )}
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-hud-emerald shadow-[0_0_8px_#10B981] radar-dot' : 'bg-text-dim'}`} />
            <span className={`text-xs font-mono font-bold ${isRunning ? 'text-hud-emerald' : 'text-text-dim'}`}>
              {isRunning ? 'SIMULATION RUNNING (1Hz)' : 'SIMULATION PAUSED'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={start}
            disabled={isRunning || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border border-hud-emerald text-hud-emerald bg-hud-emerald/10 hover:bg-hud-emerald/20 shadow-hud-green rounded-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={12} /> START
          </button>
          <button
            onClick={pause}
            disabled={!isRunning || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border border-hud-amber text-hud-amber bg-hud-amber/10 hover:bg-hud-amber/20 rounded-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pause size={12} /> PAUSE
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold border border-border text-text-secondary bg-bg-panel hover:text-text-primary hover:border-text-dim rounded-xs transition-all disabled:opacity-40"
          >
            <RotateCcw size={12} /> RESET BASELINE
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Controls */}
        <div className="w-68 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto bg-bg-primary/80">
          {/* Scenario Selection */}
          <Panel title="FAULT SCENARIO" className="border-0 border-b border-border rounded-none">
            <div className="p-3 space-y-1">
              {SCENARIOS.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 py-1.5 px-2 cursor-pointer rounded-xs transition-colors ${
                    selectedScenario === s.id ? 'bg-hud-cyan/15 text-hud-cyan font-semibold border border-hud-cyan/30' : 'hover:bg-bg-panel/40 text-text-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="scenario"
                    value={s.id}
                    checked={selectedScenario === s.id}
                    onChange={() => setSelectedScenario(s.id)}
                    className="accent-hud-cyan"
                  />
                  <span className="text-xs font-mono">{s.label}</span>
                </label>
              ))}
            </div>
          </Panel>

          {/* Severity */}
          <Panel title="INJECTION SEVERITY" className="border-0 border-b border-border rounded-none">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {SEVERITIES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`py-1.5 text-[10px] font-mono font-bold border rounded-xs transition-all ${
                      severity === s
                        ? s === 'CRITICAL' ? 'border-status-error text-status-error bg-status-error/20 shadow-hud-red'
                        : s === 'HIGH' ? 'border-hud-amber text-hud-amber bg-hud-amber/20 shadow-hud-amber'
                        : s === 'MEDIUM' ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/20 shadow-hud-cyan'
                        : 'border-hud-emerald text-hud-emerald bg-hud-emerald/20 shadow-hud-green'
                        : 'border-border/70 text-text-dim hover:border-text-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {/* Inject Button */}
          <div className="p-3 border-b border-border bg-bg-secondary/40">
            <button
              onClick={handleInjectFault}
              disabled={selectedScenario === 'none' || !isRunning}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold border border-status-error text-status-error bg-status-error/15 hover:bg-status-error/25 shadow-hud-red rounded-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Zap size={13} /> INJECT FAULT
            </button>
            {status?.fault_active && (
              <button
                onClick={clearFault}
                className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 text-[10px] font-mono font-bold border border-border text-text-secondary bg-bg-panel hover:text-text-primary rounded-xs transition-all"
              >
                <X size={11} /> CLEAR ACTIVE FAULT
              </button>
            )}
          </div>

          {/* Telemetry Noise & Artifact Conditions */}
          <Panel title="SIGNAL DISTORTIONS" className="border-0 border-b border-border rounded-none">
            <div className="p-3 space-y-2.5">
              {[
                { key: 'noise', label: 'Gaussian Noise' },
                { key: 'missing', label: 'Missing Values' },
                { key: 'delay', label: 'Latency Drift' },
                { key: 'outlier', label: 'Transient Outliers' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-secondary">{label}</span>
                  <button
                    onClick={() => handleConditionToggle(key)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold border rounded-xs transition-all ${
                      conditions[`${key}_enabled`]
                        ? 'border-hud-emerald text-hud-emerald bg-hud-emerald/15 shadow-hud-green'
                        : 'border-border text-text-dim bg-bg-panel/40'
                    }`}
                  >
                    {conditions[`${key}_enabled`] ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          {/* Real-time ML Evaluation */}
          <Panel title="REAL-TIME ML INFERENCE" className="border-0 rounded-none">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-dim">DETECTOR STATE</span>
                <span className="text-[10px] font-mono font-bold text-hud-emerald">ONLINE (13 FEAT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-dim">ANOMALY SCORE</span>
                <span className={`text-base font-orbitron font-extrabold ${
                  (ml.anomaly_score || 0) >= 0.7 ? 'text-status-error glow-red-text'
                  : (ml.anomaly_score || 0) >= 0.4 ? 'text-hud-amber glow-amber-text'
                  : 'text-hud-cyan glow-cyan-text'
                }`}>
                  {(ml.anomaly_score || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-dim">SEVERITY LEVEL</span>
                <StatusBadge status={ml.severity || 'NORMAL'} pulse={(ml.anomaly_score || 0) >= 0.7} />
              </div>
              {ml.is_anomaly && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="text-[9px] font-orbitron font-bold text-text-dim mb-1 uppercase">ESTIMATED ROOT CAUSE</div>
                  <div className="text-xs font-display font-semibold text-text-primary">{ml.root_cause}</div>
                  <div className="text-[10px] font-mono text-hud-cyan mt-0.5">
                    {ml.root_cause_confidence ? `${Math.round(ml.root_cause_confidence * 100)}% confidence` : ''}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Center: Real-time Telemetry Grid & Waveforms */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Telemetry Table */}
          <div className="border-b border-border overflow-y-auto" style={{ height: '42%' }}>
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/70 sticky top-0 text-[9px] font-orbitron tracking-wider text-text-dim">
                  <th className="px-4 py-1.5">TIME (UTC)</th>
                  <th className="px-4 py-1.5">PARAMETER</th>
                  <th className="px-4 py-1.5 text-right">VALUE</th>
                  <th className="px-4 py-1.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {TELEMETRY_PARAMS.map(({ field, label, unit }) => {
                  const val = telemetry?.[field]
                  const status = statuses[field] || 'NORMAL'
                  const timeStr = telemetry?.timestamp
                    ? new Date(telemetry.timestamp).toLocaleTimeString('en-US', { hour12: false })
                    : '—'
                  return (
                    <tr key={field} className="hover:bg-bg-panel/40 transition-colors">
                      <td className="px-4 py-1 font-mono text-[10px] text-text-dim">{timeStr}</td>
                      <td className="px-4 py-1 text-[11px] text-text-secondary">{label}</td>
                      <td className="px-4 py-1 font-mono text-[11px] text-right">
                        <span className={`font-bold ${
                          status === 'CRITICAL' ? 'text-status-error'
                          : status === 'WARNING' ? 'text-hud-amber'
                          : 'text-text-primary'
                        }`}>
                          {val != null ? `${val.toFixed(2)} ${unit}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-3">
              {CHART_FIELDS.map(({ field, label }) => (
                <Panel key={field} compact>
                  <div className="px-3 pt-2">
                    <TelemetryChart
                      data={history}
                      field={field}
                      label={label}
                      height={105}
                      faultInjectedAt={faultInjectedAt}
                    />
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Mission Simulation Event Log */}
        <div className="w-68 flex-shrink-0 border-l border-border flex flex-col bg-bg-primary/80">
          <div className="px-3 py-2 border-b border-border bg-bg-secondary/60">
            <div className="text-[10px] font-orbitron font-bold tracking-widest text-text-secondary uppercase">
              MISSION EVENT LOG
            </div>
          </div>
          <div ref={eventLogRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {events.length === 0 ? (
              <div className="text-[10px] font-mono text-text-dim text-center py-6">
                Start simulation to record real-time operational events
              </div>
            ) : (
              events.map((ev, i) => {
                const time = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })
                const isFault = ev.type === 'FAULT'
                const isAnomaly = ev.type === 'ANOMALY'
                return (
                  <div key={i} className={`border-l-2 pl-2 py-0.5 ${
                    isFault ? 'border-status-error bg-status-error/5' :
                    isAnomaly ? 'border-hud-amber bg-hud-amber/5' :
                    'border-hud-cyan bg-hud-cyan/5'
                  }`}>
                    <div className="text-[9px] font-mono text-text-dim">{time} UTC</div>
                    <div className={`text-[10px] font-mono leading-tight ${
                      isFault ? 'text-status-error font-semibold' :
                      isAnomaly ? 'text-hud-amber font-semibold' :
                      'text-text-primary'
                    }`}>
                      {ev.message}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
