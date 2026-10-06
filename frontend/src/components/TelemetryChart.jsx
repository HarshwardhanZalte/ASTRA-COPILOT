import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer
} from 'recharts'

const FIELD_METADATA = {
  battery_voltage: { color: '#00F0FF', nominalMin: 27.4, nominalMax: 28.6, unit: 'V' },
  battery_current: { color: '#F59E0B', nominalMin: 4.5, nominalMax: 5.5, unit: 'A' },
  battery_temperature: { color: '#EF4444', nominalMin: 23.0, nominalMax: 27.0, unit: '°C' },
  solar_power: { color: '#10B981', nominalMin: 1.0, nominalMax: 2.0, unit: 'kW' },
  power_consumption: { color: '#38BDF8', nominalMin: 7.9, nominalMax: 9.1, unit: 'W' },
  cpu_temperature: { color: '#FB923C', nominalMin: 40.0, nominalMax: 50.0, unit: '°C' },
  cpu_load: { color: '#4ADE80', nominalMin: 25.0, nominalMax: 45.0, unit: '%' },
  memory_usage: { color: '#FBBF24', nominalMin: 54.0, nominalMax: 66.0, unit: '%' },
  communication_signal: { color: '#A78BFA', nominalMin: -79.0, nominalMax: -71.0, unit: 'dBm' },
  packet_loss: { color: '#F87171', nominalMin: 0.0, nominalMax: 1.0, unit: '%' },
  communication_latency: { color: '#60A5FA', nominalMin: 220.0, nominalMax: 280.0, unit: 'ms' },
  payload_temperature: { color: '#F472B6', nominalMin: 18.0, nominalMax: 22.0, unit: '°C' },
  reaction_wheel_speed: { color: '#34D399', nominalMin: 2900.0, nominalMax: 3100.0, unit: 'RPM' },
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const color = payload[0]?.color || '#00F0FF'

  return (
    <div className="hud-panel border border-border/80 bg-bg-deep/95 p-2 rounded-xs shadow-hud-cyan text-[11px] font-mono min-w-[120px]">
      <div className="text-text-dim text-[10px] mb-1 tracking-wider">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-text-secondary text-[10px]">READING:</span>
        <span className="font-bold text-sm" style={{ color }}>
          {val != null ? `${Number(val).toFixed(2)} ${unit || ''}` : 'N/A'}
        </span>
      </div>
    </div>
  )
}

export default function TelemetryChart({
  data = [],
  field,
  height = 125,
  faultInjectedAt = null,
  label = '',
  showThresholds = true
}) {
  const meta = FIELD_METADATA[field] || { color: '#00F0FF', unit: '' }
  const color = meta.color
  const gradientId = `grad-${field}`

  const chartData = data.map((d, i) => ({
    t: d.timestamp ? new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false }) : `${i}s`,
    v: d[field] ?? null,
    i,
  }))

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between text-[10px] font-mono text-text-dim mb-1 px-1">
          <span className="uppercase tracking-wider text-text-secondary font-medium">{label}</span>
          {chartData.length > 0 && chartData[chartData.length - 1].v != null && (
            <span className="font-bold text-xs" style={{ color }}>
              {Number(chartData[chartData.length - 1].v).toFixed(2)} {meta.unit}
            </span>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 4, right: 6, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
            domain={['auto', 'auto']}
            width={40}
          />
          <Tooltip content={<CustomTooltip unit={meta.unit} />} />

          {/* Nominal safe threshold band */}
          {showThresholds && meta.nominalMin !== undefined && meta.nominalMax !== undefined && (
            <ReferenceArea
              y1={meta.nominalMin}
              y2={meta.nominalMax}
              fill="#10B981"
              fillOpacity={0.05}
              strokeOpacity={0.15}
              stroke="#10B981"
            />
          )}

          {/* Fault injection point marker */}
          {faultInjectedAt !== null && chartData[faultInjectedAt] && (
            <ReferenceLine
              x={chartData[faultInjectedAt]?.t}
              stroke="#EF4444"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: 'FAULT INJECTED',
                fontSize: 8,
                fill: '#EF4444',
                position: 'top',
                fontFamily: 'JetBrains Mono'
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: '#FFFFFF', stroke: color, strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

