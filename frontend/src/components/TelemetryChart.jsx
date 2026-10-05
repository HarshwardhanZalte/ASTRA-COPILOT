import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const FIELD_COLORS = {
  battery_voltage: '#38BDF8',
  battery_current: '#F59E0B',
  battery_temperature: '#EF4444',
  solar_power: '#22C55E',
  cpu_temperature: '#FB923C',
  communication_signal: '#A78BFA',
  packet_loss: '#F87171',
  communication_latency: '#60A5FA',
  cpu_load: '#4ADE80',
  memory_usage: '#FBBF24',
  payload_temperature: '#F472B6',
  reaction_wheel_speed: '#34D399',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-[#263142] bg-[#0D111A] px-3 py-2 text-xs font-mono">
      <div className="text-[#64748B] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.value?.toFixed(3)}
        </div>
      ))}
    </div>
  )
}

export default function TelemetryChart({ data, field, height = 120, faultInjectedAt = null, label = '' }) {
  const color = FIELD_COLORS[field] || '#38BDF8'
  
  const chartData = data.map((d, i) => ({
    t: new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false }),
    v: d[field] ?? null,
    i,
  }))

  return (
    <div>
      {label && <div className="text-[10px] text-[#64748B] mb-1 px-1">{label}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          {faultInjectedAt !== null && (
            <ReferenceLine
              x={chartData[faultInjectedAt]?.t}
              stroke="#EF4444"
              strokeDasharray="4 2"
              label={{ value: 'FAULT', fontSize: 8, fill: '#EF4444', position: 'top' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
