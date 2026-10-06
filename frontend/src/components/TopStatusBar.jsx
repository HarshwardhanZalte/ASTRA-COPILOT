import { useState, useEffect } from 'react'
import { Radio, ShieldAlert, Cpu, Orbit, SunMedium, Clock, Wifi } from 'lucide-react'
import { useTelemetry } from '../hooks/useTelemetry'
import StatusBadge from './StatusBadge'

export default function TopStatusBar() {
  const { telemetry, connected } = useTelemetry(10)
  const [utcTime, setUtcTime] = useState('')
  const [latency, setLatency] = useState(14)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setUtcTime(now.toUTCString().slice(17, 25))
      // Simulate micro jitter in telemetry ping
      setLatency(Math.floor(12 + Math.random() * 6))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const ml = telemetry?.ml || {}
  const isAnomaly = ml.is_anomaly
  const anomalyScore = ml.anomaly_score != null ? Math.round(ml.anomaly_score * 100) : 0
  const solarPower = telemetry?.solar_power ?? 1.5
  const inEclipse = solarPower < 0.2

  return (
    <header className="h-12 border-b border-border bg-bg-secondary/90 backdrop-blur-md flex items-center justify-between px-4 text-xs font-mono select-none z-20">
      {/* Left items: Satellite identifier & orbital stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hud-cyan shadow-[0_0_8px_#00F0FF] radar-dot" />
          <span className="font-orbitron font-bold tracking-widest text-hud-cyan text-sm">SAT-01</span>
          <span className="text-[10px] text-text-dim px-1.5 py-0.5 border border-border rounded-xs bg-bg-panel">
            LEO • 450KM
          </span>
        </div>

        <div className="h-4 w-px bg-border/80" />

        {/* Orbit Sun / Eclipse State */}
        <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
          <SunMedium size={13} className={inEclipse ? 'text-text-dim' : 'text-hud-amber animate-pulse'} />
          <span className="text-text-dim">STATE:</span>
          <span className={inEclipse ? 'text-text-dim' : 'text-hud-amber font-semibold'}>
            {inEclipse ? 'ECLIPSE' : 'SUNLIT'}
          </span>
        </div>

        <div className="h-4 w-px bg-border/80 hidden md:block" />

        {/* Anomaly quick flag */}
        {isAnomaly ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-status-error/60 bg-status-error/15 rounded-xs animate-pulse">
            <ShieldAlert size={12} className="text-status-error" />
            <span className="text-[10px] font-bold text-status-error tracking-wider">
              ANOMALY ACTIVE ({anomalyScore}%)
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 border border-hud-emerald/30 bg-hud-emerald/5 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-emerald" />
            <span className="text-[10px] text-hud-emerald tracking-wide">SYSTEMS NOMINAL</span>
          </div>
        )}
      </div>

      {/* Right items: Latency, WebSocket status, UTC Clock */}
      <div className="flex items-center gap-4">
        {/* Stream link indicator */}
        <div className="flex items-center gap-1.5">
          <Wifi size={13} className={connected ? 'text-hud-emerald' : 'text-status-error'} />
          <span className="text-[10px] text-text-dim hidden sm:inline">WS:</span>
          <span className={`text-[10px] font-bold ${connected ? 'text-hud-emerald' : 'text-status-error'}`}>
            {connected ? `${latency}ms` : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-px bg-border/80" />

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-text-primary">
          <Clock size={13} className="text-hud-cyan" />
          <span className="text-text-dim text-[10px]">UTC:</span>
          <span className="font-bold tracking-wider text-hud-cyan text-[11px]">
            {utcTime || '00:00:00'}
          </span>
        </div>
      </div>
    </header>
  )
}
