import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import TelemetryChart from '../components/TelemetryChart'
import { useTelemetry } from '../hooks/useTelemetry'

const ALL_FIELDS = [
  { field: 'battery_voltage', label: 'Battery Voltage', unit: 'V', subsystem: 'POWER' },
  { field: 'battery_current', label: 'Battery Current', unit: 'A', subsystem: 'POWER' },
  { field: 'battery_temperature', label: 'Battery Temperature', unit: '°C', subsystem: 'POWER' },
  { field: 'solar_power', label: 'Solar Power', unit: 'kW', subsystem: 'POWER' },
  { field: 'power_consumption', label: 'Power Consumption', unit: 'W', subsystem: 'POWER' },
  { field: 'cpu_temperature', label: 'CPU Temperature', unit: '°C', subsystem: 'THERMAL' },
  { field: 'payload_temperature', label: 'Payload Temperature', unit: '°C', subsystem: 'THERMAL' },
  { field: 'cpu_load', label: 'CPU Load', unit: '%', subsystem: 'COMPUTING' },
  { field: 'memory_usage', label: 'Memory Usage', unit: '%', subsystem: 'COMPUTING' },
  { field: 'communication_signal', label: 'Signal Strength', unit: 'dBm', subsystem: 'COMMS' },
  { field: 'packet_loss', label: 'Packet Loss', unit: '%', subsystem: 'COMMS' },
  { field: 'communication_latency', label: 'Latency', unit: 'ms', subsystem: 'COMMS' },
  { field: 'reaction_wheel_speed', label: 'Reaction Wheel Speed', unit: 'RPM', subsystem: 'PAYLOAD' },
]

export default function TelemetryPage() {
  const { telemetry, history, connected } = useTelemetry(150)
  const statuses = telemetry?.statuses || {}

  const CHART_FIELDS = [
    'battery_voltage', 'battery_current', 'battery_temperature',
    'solar_power', 'cpu_temperature', 'communication_signal',
    'packet_loss', 'cpu_load'
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">MISSION OPERATIONS / TELEMETRY</div>
          <h1 className="text-lg font-semibold text-[#E5E7EB]">Live Telemetry Stream</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
          <span className={`text-xs font-mono ${connected ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {connected ? 'STREAM LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Telemetry Table */}
        <Panel title="PARAMETER TABLE" className="col-span-1">
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#263142] sticky top-0 bg-[#0D111A]">
                  <th className="px-3 py-1.5 text-left text-[10px] font-mono text-[#64748B] font-normal">SUBSYSTEM</th>
                  <th className="px-3 py-1.5 text-left text-[10px] font-mono text-[#64748B] font-normal">PARAMETER</th>
                  <th className="px-3 py-1.5 text-right text-[10px] font-mono text-[#64748B] font-normal">VALUE</th>
                  <th className="px-3 py-1.5 text-center text-[10px] font-mono text-[#64748B] font-normal">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {ALL_FIELDS.map(({ field, label, unit, subsystem }) => {
                  const val = telemetry?.[field]
                  const status = statuses[field] || 'NORMAL'
                  return (
                    <tr key={field} className="border-b border-[#1a2332] hover:bg-white/2">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-[#64748B] uppercase">{subsystem}</td>
                      <td className="px-3 py-1.5 text-[11px] text-[#94A3B8]">{label}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-right">
                        <span className={`${
                          status === 'CRITICAL' ? 'text-[#EF4444]'
                          : status === 'WARNING' ? 'text-[#F59E0B]'
                          : 'text-[#E5E7EB]'
                        }`}>
                          {val != null ? `${val.toFixed(2)} ${unit}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        
        {/* Charts Grid */}
        <div className="col-span-1 grid grid-cols-2 gap-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
          {CHART_FIELDS.map((field) => {
             const labelInfo = ALL_FIELDS.find(f => f.field === field)
             const labelStr = labelInfo ? `${labelInfo.label} (${labelInfo.unit})` : field
             return (
               <Panel key={field} compact>
                 <div className="p-2">
                   <TelemetryChart data={history} field={field} label={labelStr} height={120} />
                 </div>
               </Panel>
             )
          })}
        </div>
      </div>
    </div>
  )
}
