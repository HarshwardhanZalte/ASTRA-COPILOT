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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#263142] px-6 py-3 flex items-center justify-between" style={{ background: '#0D111A' }}>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] tracking-widest text-[#64748B] font-mono">ASTRA / SIMULATION CONTROL</div>
            <div className="text-sm font-semibold text-[#E5E7EB] font-mono">SAT-01</div>
          </div>
          <div className="flex items-center gap-2">
            {status?.demo_data_loaded && (
              <span className="text-[9px] font-mono text-[#38BDF8]">DEMO HISTORY</span>
            )}
            <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#22C55E]' : 'bg-[#64748B]'}`} />
            <span className={`text-xs font-mono ${isRunning ? 'text-[#22C55E]' : 'text-[#64748B]'}`}>
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          {connected ? (
            <span className="text-[10px] font-mono text-[#22C55E]">WS LIVE</span>
          ) : (
            <span className="text-[10px] font-mono text-[#EF4444]">WS DISCONNECTED</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={start}
            disabled={isRunning || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: '1px solid #22C55E', color: '#22C55E' }}
          >
            <Play size={11} /> START
          </button>
          <button
            onClick={pause}
            disabled={!isRunning || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}
          >
            <Pause size={11} /> PAUSE
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border disabled:opacity-40"
            style={{ border: '1px solid #263142', color: '#94A3B8' }}
          >
            <RotateCcw size={11} /> RESET
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 flex-shrink-0 border-r border-[#263142] flex flex-col overflow-y-auto" style={{ background: '#0D111A' }}>
          {/* Scenario */}
          <Panel title="SCENARIO" className="border-0 border-b border-[#263142]">
            <div className="p-3 space-y-1">
              {SCENARIOS.map(s => (
                <label key={s.id} className="flex items-center gap-2.5 py-1.5 px-2 cursor-pointer hover:bg-white/3 rounded">
                  <input
                    type="radio"
                    name="scenario"
                    value={s.id}
                    checked={selectedScenario === s.id}
                    onChange={() => setSelectedScenario(s.id)}
                    className="accent-[#38BDF8]"
                  />
                  <span className="text-xs text-[#94A3B8]">{s.label}</span>
                </label>
              ))}
            </div>
          </Panel>

          {/* Severity */}
          <Panel title="SEVERITY" className="border-0 border-b border-[#263142]">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {SEVERITIES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`py-1.5 text-[10px] font-mono font-semibold border transition-all ${
                      severity === s
                        ? s === 'CRITICAL' ? 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10'
                        : s === 'HIGH' ? 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10'
                        : s === 'MEDIUM' ? 'border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/10'
                        : 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10'
                        : 'border-[#263142] text-[#64748B] hover:border-[#38BDF8]/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {/* Inject */}
          <div className="p-3 border-b border-[#263142]">
            <button
              onClick={handleInjectFault}
              disabled={selectedScenario === 'none' || !isRunning}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-semibold border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ border: '1px solid #EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.05)' }}
            >
              <Zap size={12} /> INJECT FAULT
            </button>
            {status?.fault_active && (
              <button
                onClick={clearFault}
                className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 text-[10px] font-mono border"
                style={{ border: '1px solid #263142', color: '#94A3B8' }}
              >
                <X size={10} /> CLEAR FAULT
              </button>
            )}
          </div>

          {/* Telemetry Conditions */}
          <Panel title="TELEMETRY CONDITIONS" className="border-0 border-b border-[#263142]">
            <div className="p-3 space-y-3">
              {[
                { key: 'noise', label: 'Noise' },
                { key: 'missing', label: 'Missing Values' },
                { key: 'delay', label: 'Delayed Data' },
                { key: 'outlier', label: 'Outliers' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">{label}</span>
                  <button
                    onClick={() => handleConditionToggle(key)}
                    className={`px-2 py-0.5 text-[10px] font-mono border transition-all ${
                      conditions[`${key}_enabled`]
                        ? 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10'
                        : 'border-[#263142] text-[#64748B]'
                    }`}
                  >
                    {conditions[`${key}_enabled`] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
              {conditions.delay_enabled && (
                <div className="pt-2 border-t border-[#263142] text-[10px] font-mono text-[#94A3B8] space-y-1">
                  <div>SIMULATED DELAY: {status?.noise_config?.delay_seconds ?? 5}s</div>
                  <div>PENDING: {status?.delivery?.pending_packets ?? 0}</div>
                  <div>DELAYED: {status?.delivery?.delayed_packets ?? 0}</div>
                  <div>OUT OF ORDER: {status?.delivery?.out_of_order_packets ?? 0}</div>
                  {telemetry?.delivery_quality && (
                    <div className={telemetry.delivery_quality.status === 'OUT_OF_ORDER'
                      ? 'text-[#F59E0B]' : 'text-[#22C55E]'}>
                      LATEST EVENT: {telemetry.delivery_quality.status}
                      {' · '}{telemetry.delivery_quality.latency_seconds}s
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* ML Status */}
          <Panel title="MODEL STATUS" className="border-0">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B]">Anomaly Detection</span>
                <span className="text-[10px] font-mono text-[#22C55E]">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B]">Anomaly Score</span>
                <span className={`text-sm font-mono font-bold ${
                  (ml.anomaly_score || 0) >= 0.7 ? 'text-[#EF4444]'
                  : (ml.anomaly_score || 0) >= 0.4 ? 'text-[#F59E0B]'
                  : 'text-[#22C55E]'
                }`}>
                  {(ml.anomaly_score || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B]">Confidence</span>
                <span className="text-xs font-mono text-[#E5E7EB]">
                  {ml.confidence ? `${Math.round(ml.confidence * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B]">Severity</span>
                {ml.severity ? <StatusBadge status={ml.severity} /> : <span className="text-[10px] text-[#64748B]">—</span>}
              </div>
              {ml.is_anomaly && (
                <div className="mt-2 pt-2 border-t border-[#263142]">
                  <div className="text-[10px] text-[#64748B] mb-1">Root Cause</div>
                  <div className="text-[11px] text-[#E5E7EB]">{ml.root_cause}</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    {ml.root_cause_confidence ? `${Math.round(ml.root_cause_confidence * 100)}% confidence` : ''}
                  </div>
                </div>
              )}
              {/* Subsystem scores */}
              {ml.subsystem_scores && (
                <div className="mt-2 pt-2 border-t border-[#263142] space-y-1.5">
                  <div className="text-[10px] text-[#64748B] mb-1">SUBSYSTEM ANALYSIS</div>
                  {Object.entries(ml.subsystem_scores).map(([sub, score]) => (
                    <div key={sub} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#64748B] w-14 uppercase">{sub}</span>
                      <div className="flex-1 h-1 bg-[#263142]">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${Math.round(score * 100)}%`,
                            background: score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#22C55E'
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8] w-8 text-right">
                        {score.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Center — Telemetry */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Telemetry Table */}
          <div className="border-b border-[#263142]" style={{ height: '45%', overflowY: 'auto' }}>
            <div className="px-4 py-2 border-b border-[#263142]" style={{ background: '#0D111A' }}>
              <div className="text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase">Live Telemetry</div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#263142]">
                  <th className="px-4 py-1.5 text-left text-[10px] font-mono text-[#64748B] font-normal">TIME (UTC)</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-mono text-[#64748B] font-normal">PARAMETER</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-mono text-[#64748B] font-normal">VALUE</th>
                  <th className="px-4 py-1.5 text-center text-[10px] font-mono text-[#64748B] font-normal">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {TELEMETRY_PARAMS.map(({ field, label, unit }) => {
                  const val = telemetry?.[field]
                  const status = statuses[field] || 'NORMAL'
                  const timeStr = telemetry?.timestamp
                    ? new Date(telemetry.timestamp).toLocaleTimeString('en-US', { hour12: false })
                    : '—'
                  return (
                    <tr key={field} className="border-b border-[#1a2332] hover:bg-white/2">
                      <td className="px-4 py-1.5 font-mono text-[11px] text-[#64748B]">{timeStr}</td>
                      <td className="px-4 py-1.5 text-[11px] text-[#94A3B8]">{label}</td>
                      <td className="px-4 py-1.5 font-mono text-[11px] text-right">
                        <span className={`${
                          status === 'CRITICAL' ? 'text-[#EF4444]'
                          : status === 'WARNING' ? 'text-[#F59E0B]'
                          : 'text-[#E5E7EB]'
                        }`}>
                          {val != null ? `${val.toFixed(2)} ${unit}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-center">
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
                <Panel key={field} compact className="">
                  <div className="px-3 pt-2">
                    <TelemetryChart
                      data={history}
                      field={field}
                      label={label}
                      height={110}
                      faultInjectedAt={faultInjectedAt}
                    />
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Event Log */}
        <div className="w-64 flex-shrink-0 border-l border-[#263142] flex flex-col" style={{ background: '#0D111A' }}>
          <div className="px-3 py-2.5 border-b border-[#263142]">
            <div className="text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase">Event Log</div>
          </div>
          <div ref={eventLogRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {events.length === 0 && (
              <div className="text-[10px] text-[#64748B] p-2">Start simulation to see events</div>
            )}
            {events.map((ev, i) => {
              const time = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })
              const typeColors = {
                FAULT: 'text-[#EF4444]',
                ANOMALY: 'text-[#F59E0B]',
                INCIDENT: 'text-[#38BDF8]',
                ANALYSIS: 'text-[#A78BFA]',
              }
              const color = typeColors[ev.type] || 'text-[#94A3B8]'
              return (
                <div key={i} className="border-l-2 border-[#263142] pl-2">
                  <div className="text-[9px] font-mono text-[#64748B]">{time}</div>
                  <div className={`text-[10px] ${color}`}>{ev.message}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
