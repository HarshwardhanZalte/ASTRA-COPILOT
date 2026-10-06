import { useState, useMemo } from 'react'
import { Filter, Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import TelemetryChart from '../components/TelemetryChart'
import Sparkline from '../components/Sparkline'
import TimeTravelScrubber from '../components/TimeTravelScrubber'
import { useTelemetry } from '../hooks/useTelemetry'

const ALL_FIELDS = [
  { field: 'battery_voltage', label: 'Battery Voltage', unit: 'V', subsystem: 'POWER', color: '#00F0FF' },
  { field: 'battery_current', label: 'Battery Current', unit: 'A', subsystem: 'POWER', color: '#F59E0B' },
  { field: 'battery_temperature', label: 'Battery Temp', unit: '°C', subsystem: 'POWER', color: '#EF4444' },
  { field: 'solar_power', label: 'Solar Power', unit: 'kW', subsystem: 'POWER', color: '#10B981' },
  { field: 'power_consumption', label: 'Power Consumption', unit: 'W', subsystem: 'POWER', color: '#38BDF8' },
  { field: 'cpu_temperature', label: 'CPU Temp', unit: '°C', subsystem: 'THERMAL', color: '#FB923C' },
  { field: 'payload_temperature', label: 'Payload Temp', unit: '°C', subsystem: 'THERMAL', color: '#F472B6' },
  { field: 'cpu_load', label: 'CPU Load', unit: '%', subsystem: 'COMPUTING', color: '#4ADE80' },
  { field: 'memory_usage', label: 'Memory Usage', unit: '%', subsystem: 'COMPUTING', color: '#FBBF24' },
  { field: 'communication_signal', label: 'Signal Strength', unit: 'dBm', subsystem: 'COMMS', color: '#A78BFA' },
  { field: 'packet_loss', label: 'Packet Loss', unit: '%', subsystem: 'COMMS', color: '#F87171' },
  { field: 'communication_latency', label: 'Latency', unit: 'ms', subsystem: 'COMMS', color: '#60A5FA' },
  { field: 'reaction_wheel_speed', label: 'Wheel Speed', unit: 'RPM', subsystem: 'PAYLOAD', color: '#34D399' },
]

const SUBSYSTEM_FILTERS = ['ALL', 'POWER', 'THERMAL', 'COMPUTING', 'COMMS', 'PAYLOAD']

export default function TelemetryPage() {
  const { telemetry, history, connected, faultInjectedAt } = useTelemetry(150)
  const [selectedSubsystem, setSelectedSubsystem] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [pinnedField, setPinnedField] = useState('battery_voltage')
  const [selectedFrame, setSelectedFrame] = useState(null)

  // Use historical frame if scrubbing, else latest telemetry
  const activeReading = selectedFrame != null && history[selectedFrame]
    ? history[selectedFrame]
    : telemetry

  const statuses = activeReading?.statuses || telemetry?.statuses || {}

  // Compute live rate of change (delta between last 2 history readings)
  const deltas = useMemo(() => {
    if (history.length < 2) return {}
    const latest = history[history.length - 1]
    const prev = history[history.length - 2]
    const result = {}
    ALL_FIELDS.forEach(({ field }) => {
      if (latest[field] != null && prev[field] != null) {
        result[field] = latest[field] - prev[field]
      }
    })
    return result
  }, [history])

  const filteredFields = ALL_FIELDS.filter(item => {
    const matchSubsystem = selectedSubsystem === 'ALL' || item.subsystem === selectedSubsystem
    const matchSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.field.includes(searchQuery.toLowerCase())
    return matchSubsystem && matchSearch
  })

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="text-[10px] tracking-widest text-text-dim font-mono mb-0.5">
            MISSION OPERATIONS • SENSORS & BUS
          </div>
          <h1 className="text-xl font-orbitron font-bold text-text-primary tracking-wide">
            Live Telemetry Matrix
          </h1>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {SUBSYSTEM_FILTERS.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubsystem(sub)}
              className={`px-2.5 py-1 text-[10px] font-mono tracking-wider rounded-xs border transition-all ${
                selectedSubsystem === sub
                  ? 'border-hud-cyan bg-hud-cyan/15 text-hud-cyan font-bold shadow-hud-cyan'
                  : 'border-border/70 bg-bg-panel/40 text-text-dim hover:text-text-secondary hover:border-border'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Telemetry Parameter Table */}
        <Panel
          title="TELEMETRY CHANNEL ROSTER"
          className="lg:col-span-7"
          headerRight={
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-dim hidden sm:inline">CHANNELS:</span>
              <span className="text-[10px] font-mono font-bold text-hud-cyan">{filteredFields.length} / {ALL_FIELDS.length}</span>
            </div>
          }
        >
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/70 sticky top-0 z-10 text-[9px] font-orbitron tracking-wider text-text-dim">
                  <th className="px-3 py-2">SYS</th>
                  <th className="px-3 py-2">PARAMETER</th>
                  <th className="px-3 py-2 text-right">VALUE</th>
                  <th className="px-3 py-2 text-center">Δ / SEC</th>
                  <th className="px-3 py-2 text-center">TREND (25s)</th>
                  <th className="px-3 py-2 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                {filteredFields.map(({ field, label, unit, subsystem, color }) => {
                  const val = activeReading?.[field]
                  const status = statuses[field] || 'NORMAL'
                  const delta = deltas[field]
                  const isPinned = pinnedField === field

                  return (
                    <tr
                      key={field}
                      onClick={() => setPinnedField(field)}
                      className={`cursor-pointer transition-colors ${
                        isPinned ? 'bg-hud-cyan/10 border-l-2 border-l-hud-cyan' : 'hover:bg-bg-panel/60 border-l-2 border-l-transparent'
                      }`}
                    >
                      <td className="px-3 py-2 text-[10px] font-semibold text-text-dim uppercase">
                        {subsystem}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-text-primary text-[11px] font-medium">{label}</div>
                        <div className="text-[9px] text-text-dim">{field}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`text-[12px] font-bold ${
                          status === 'CRITICAL' ? 'text-status-error' :
                          status === 'WARNING' ? 'text-hud-amber' :
                          'text-text-primary'
                        }`}>
                          {val != null ? `${Number(val).toFixed(2)}` : '—'}
                        </span>
                        <span className="text-[10px] text-text-dim ml-1">{unit}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[10px]">
                        {delta != null && Math.abs(delta) > 0.001 ? (
                          <span className={`inline-flex items-center gap-0.5 font-bold ${delta > 0 ? 'text-hud-emerald' : 'text-hud-rose'}`}>
                            {delta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {Math.abs(delta).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-text-dim inline-flex items-center">
                            <Minus size={11} />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Sparkline
                          data={history}
                          field={field}
                          color={color}
                          status={status}
                          selectedFrame={selectedFrame}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Right Column: Pinned Big Chart & Subsystem Quick Charts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Pinned Chart View */}
          <Panel
            title={`FOCUSED TELEMETRY: ${ALL_FIELDS.find(f => f.field === pinnedField)?.label.toUpperCase() || 'CHANNEL'}`}
            glow={true}
          >
            <div className="p-3">
              <TelemetryChart
                data={history}
                field={pinnedField}
                label={`${ALL_FIELDS.find(f => f.field === pinnedField)?.label} (${ALL_FIELDS.find(f => f.field === pinnedField)?.unit})`}
                height={170}
                faultInjectedAt={faultInjectedAt}
                selectedFrame={selectedFrame}
              />
            </div>
          </Panel>

          {/* Secondary 2-Grid of Subsystem Charts */}
          <Panel title="MULTI-PARAMETER WAVEFORMS">
            <div className="p-3 grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
              {['cpu_temperature', 'solar_power', 'communication_signal', 'cpu_load'].map(f => {
                const info = ALL_FIELDS.find(item => item.field === f)
                return (
                  <div key={f} className="p-2 rounded-xs border border-border/60 bg-bg-secondary/40">
                    <TelemetryChart
                      data={history}
                      field={f}
                      label={`${info?.label} (${info?.unit})`}
                      height={100}
                      faultInjectedAt={faultInjectedAt}
                      selectedFrame={selectedFrame}
                    />
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
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


