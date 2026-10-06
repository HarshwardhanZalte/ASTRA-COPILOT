import { useState } from 'react'
import { Zap, Flame, Radio, Cpu, Activity, Info } from 'lucide-react'

export default function SatelliteVisualizer({
  telemetry = null,
  subsystemScores = {},
  onSelectSubsystem = null,
  selectedSubsystem = null,
  compact = false
}) {
  const [hoveredSub, setHoveredSub] = useState(null)

  const scores = {
    power: subsystemScores.power ?? 0,
    thermal: subsystemScores.thermal ?? 0,
    communication: subsystemScores.communication ?? 0,
    computing: subsystemScores.computing ?? 0,
    payload: subsystemScores.payload ?? 0,
  }

  const getSubsystemColor = (score) => {
    if (score >= 0.7) return '#EF4444' // Critical
    if (score >= 0.4) return '#F59E0B' // Warning
    return '#00F0FF' // Nominal
  }

  const getSubsystemGlow = (score) => {
    if (score >= 0.7) return 'drop-shadow(0 0 8px #EF4444)'
    if (score >= 0.4) return 'drop-shadow(0 0 6px #F59E0B)'
    return 'drop-shadow(0 0 4px #00F0FF)'
  }

  return (
    <div className="hud-panel p-4 border border-border bg-bg-panel/70 rounded-xs select-none relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan shadow-[0_0_6px_#00F0FF]" />
          <span className="text-[10px] font-orbitron font-bold tracking-widest text-text-secondary uppercase">
            SAT-01 SUBSYSTEM HEATMAP SCHEMATIC
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-text-dim">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-hud-cyan" /> NOMINAL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-hud-amber" /> WARN (&gt;0.4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-error" /> CRITICAL (&gt;0.7)
          </span>
        </div>
      </div>

      {/* SVG Satellite Wireframe Map */}
      <div className="relative flex items-center justify-center py-2">
        <svg
          viewBox="0 0 600 240"
          className="w-full max-w-[580px] h-auto overflow-visible"
        >
          {/* Background Space Grid & Orbit Ring */}
          <ellipse
            cx="300"
            cy="120"
            rx="270"
            ry="90"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* LEFT SOLAR WING (Power Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('power')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('power')}
            style={{ filter: getSubsystemGlow(scores.power) }}
          >
            {/* Wing boom */}
            <line x1="160" y1="120" x2="220" y2="120" stroke="#334155" strokeWidth="3" />
            {/* Solar Panels Grid */}
            <rect x="50" y="70" width="110" height="100" rx="3" fill="#0B132B" stroke={getSubsystemColor(scores.power)} strokeWidth="1.5" />
            {/* Panel cell lines */}
            <line x1="50" y1="103" x2="160" y2="103" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="50" y1="136" x2="160" y2="136" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="86" y1="70" x2="86" y2="170" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="123" y1="70" x2="123" y2="170" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <text x="105" y="62" fill={getSubsystemColor(scores.power)} fontSize="9" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              SOLAR ARRAY L
            </text>
          </g>

          {/* RIGHT SOLAR WING (Power Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('power')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('power')}
            style={{ filter: getSubsystemGlow(scores.power) }}
          >
            <line x1="380" y1="120" x2="440" y2="120" stroke="#334155" strokeWidth="3" />
            <rect x="440" y="70" width="110" height="100" rx="3" fill="#0B132B" stroke={getSubsystemColor(scores.power)} strokeWidth="1.5" />
            <line x1="440" y1="103" x2="550" y2="103" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="440" y1="136" x2="550" y2="136" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="476" y1="70" x2="476" y2="170" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <line x1="513" y1="70" x2="513" y2="170" stroke={getSubsystemColor(scores.power)} strokeWidth="0.75" strokeOpacity="0.6" />
            <text x="495" y="62" fill={getSubsystemColor(scores.power)} fontSize="9" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              SOLAR ARRAY R
            </text>
          </g>

          {/* CENTRAL BUS / CHASSIS */}
          <rect
            x="220"
            y="55"
            width="160"
            height="130"
            rx="4"
            fill="#070D1B"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* HIGH-GAIN ANTENNA DISH (Communication Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('communication')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('communication')}
            style={{ filter: getSubsystemGlow(scores.communication) }}
          >
            <line x1="300" y1="55" x2="300" y2="28" stroke="#334155" strokeWidth="2" />
            {/* Dish curve */}
            <path
              d="M 270 28 Q 300 12 330 28"
              fill="none"
              stroke={getSubsystemColor(scores.communication)}
              strokeWidth="2.5"
            />
            {/* Feed horn */}
            <line x1="300" y1="20" x2="300" y2="12" stroke={getSubsystemColor(scores.communication)} strokeWidth="2" />
            <circle cx="300" cy="12" r="2.5" fill={getSubsystemColor(scores.communication)} />
            <text x="300" y="6" fill={getSubsystemColor(scores.communication)} fontSize="8" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              S-BAND COMMS
            </text>
          </g>

          {/* THERMAL RADIATOR PANELS (Thermal Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('thermal')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('thermal')}
            style={{ filter: getSubsystemGlow(scores.thermal) }}
          >
            <rect
              x="230"
              y="65"
              width="65"
              height="45"
              rx="2"
              fill="#0E1729"
              stroke={getSubsystemColor(scores.thermal)}
              strokeWidth="1.5"
            />
            {/* Radiator cooling fins */}
            <line x1="235" y1="76" x2="290" y2="76" stroke={getSubsystemColor(scores.thermal)} strokeWidth="1" strokeOpacity="0.7" />
            <line x1="235" y1="87" x2="290" y2="87" stroke={getSubsystemColor(scores.thermal)} strokeWidth="1" strokeOpacity="0.7" />
            <line x1="235" y1="98" x2="290" y2="98" stroke={getSubsystemColor(scores.thermal)} strokeWidth="1" strokeOpacity="0.7" />
            <text x="262" y="74" fill={getSubsystemColor(scores.thermal)} fontSize="7" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              RADIATOR
            </text>
          </g>

          {/* ON-BOARD FLIGHT COMPUTER / AVIONICS (Computing Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('computing')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('computing')}
            style={{ filter: getSubsystemGlow(scores.computing) }}
          >
            <rect
              x="305"
              y="65"
              width="65"
              height="45"
              rx="2"
              fill="#0E1729"
              stroke={getSubsystemColor(scores.computing)}
              strokeWidth="1.5"
            />
            <circle cx="325" cy="85" r="5" fill="none" stroke={getSubsystemColor(scores.computing)} strokeWidth="1" />
            <circle cx="350" cy="85" r="5" fill="none" stroke={getSubsystemColor(scores.computing)} strokeWidth="1" />
            <text x="337" y="74" fill={getSubsystemColor(scores.computing)} fontSize="7" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              OBC CORE
            </text>
          </g>

          {/* PAYLOAD OPTICS & REACTION WHEELS (Payload Subsystem) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSub('payload')}
            onMouseLeave={() => setHoveredSub(null)}
            onClick={() => onSelectSubsystem && onSelectSubsystem('payload')}
            style={{ filter: getSubsystemGlow(scores.payload) }}
          >
            {/* Payload Optical Lens */}
            <circle cx="265" cy="145" r="18" fill="#0E1729" stroke={getSubsystemColor(scores.payload)} strokeWidth="1.5" />
            <circle cx="265" cy="145" r="10" fill="none" stroke={getSubsystemColor(scores.payload)} strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="265" cy="145" r="4" fill={getSubsystemColor(scores.payload)} />
            <text x="265" y="174" fill={getSubsystemColor(scores.payload)} fontSize="7" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              PAYLOAD
            </text>

            {/* Reaction Wheel Assembly */}
            <circle cx="337" cy="145" r="16" fill="#0E1729" stroke={getSubsystemColor(scores.payload)} strokeWidth="1.5" />
            <line x1="325" y1="145" x2="349" y2="145" stroke={getSubsystemColor(scores.payload)} strokeWidth="1.5" />
            <line x1="337" y1="133" x2="337" y2="157" stroke={getSubsystemColor(scores.payload)} strokeWidth="1.5" />
            <text x="337" y="174" fill={getSubsystemColor(scores.payload)} fontSize="7" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">
              R-WHEEL
            </text>
          </g>
        </svg>
      </div>

      {/* Subsystem Quick Stats Bar Below Schematic */}
      <div className="grid grid-cols-5 gap-2 pt-3 border-t border-border/50 text-center font-mono text-[10px]">
        {[
          { key: 'power', name: 'POWER', val: telemetry?.battery_voltage != null ? `${telemetry.battery_voltage.toFixed(1)}V` : '28.0V', score: scores.power },
          { key: 'thermal', name: 'THERMAL', val: telemetry?.cpu_temperature != null ? `${telemetry.cpu_temperature.toFixed(1)}°C` : '45.0°C', score: scores.thermal },
          { key: 'communication', name: 'COMMS', val: telemetry?.communication_signal != null ? `${telemetry.communication_signal.toFixed(0)}dBm` : '-75dBm', score: scores.communication },
          { key: 'computing', name: 'COMPUTE', val: telemetry?.cpu_load != null ? `${telemetry.cpu_load.toFixed(0)}%` : '35%', score: scores.computing },
          { key: 'payload', name: 'PAYLOAD', val: telemetry?.reaction_wheel_speed != null ? `${telemetry.reaction_wheel_speed.toFixed(0)}RPM` : '3000RPM', score: scores.payload },
        ].map(item => (
          <div
            key={item.key}
            className={`p-2 rounded-xs border transition-all ${
              hoveredSub === item.key || selectedSubsystem === item.key
                ? 'border-hud-cyan bg-hud-cyan/15 shadow-hud-cyan'
                : 'border-border/60 bg-bg-secondary/40'
            }`}
          >
            <div className="text-[9px] text-text-dim uppercase font-bold">{item.name}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: getSubsystemColor(item.score) }}>
              {item.val}
            </div>
            <div className="text-[8px] text-text-dim mt-0.5">DEV: {(item.score * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
