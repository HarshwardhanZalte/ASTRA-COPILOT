export default function StatusBadge({ status, size = 'sm', pulse = false }) {
  const configs = {
    NORMAL: {
      color: 'text-hud-emerald bg-hud-emerald/10 border-hud-emerald/40',
      dot: 'bg-hud-emerald shadow-[0_0_6px_#10B981]'
    },
    OK: {
      color: 'text-hud-emerald bg-hud-emerald/10 border-hud-emerald/40',
      dot: 'bg-hud-emerald shadow-[0_0_6px_#10B981]'
    },
    WARNING: {
      color: 'text-hud-amber bg-hud-amber/10 border-hud-amber/40',
      dot: 'bg-hud-amber shadow-[0_0_6px_#F59E0B]'
    },
    WARN: {
      color: 'text-hud-amber bg-hud-amber/10 border-hud-amber/40',
      dot: 'bg-hud-amber shadow-[0_0_6px_#F59E0B]'
    },
    CRITICAL: {
      color: 'text-status-error bg-status-error/15 border-status-error/50 shadow-[0_0_10px_rgba(239,68,68,0.25)]',
      dot: 'bg-status-error shadow-[0_0_8px_#EF4444]'
    },
    ERROR: {
      color: 'text-status-error bg-status-error/15 border-status-error/50 shadow-[0_0_10px_rgba(239,68,68,0.25)]',
      dot: 'bg-status-error shadow-[0_0_8px_#EF4444]'
    },
    HIGH: {
      color: 'text-status-error bg-status-error/15 border-status-error/50',
      dot: 'bg-status-error shadow-[0_0_6px_#EF4444]'
    },
    MEDIUM: {
      color: 'text-hud-amber bg-hud-amber/10 border-hud-amber/40',
      dot: 'bg-hud-amber shadow-[0_0_6px_#F59E0B]'
    },
    LOW: {
      color: 'text-hud-cyan bg-hud-cyan/10 border-hud-cyan/40',
      dot: 'bg-hud-cyan shadow-[0_0_6px_#00F0FF]'
    },
    OPEN: {
      color: 'text-hud-amber bg-hud-amber/10 border-hud-amber/40',
      dot: 'bg-hud-amber shadow-[0_0_6px_#F59E0B]'
    },
    RESOLVED: {
      color: 'text-hud-emerald bg-hud-emerald/10 border-hud-emerald/40',
      dot: 'bg-hud-emerald shadow-[0_0_6px_#10B981]'
    },
    INFO: {
      color: 'text-hud-cyan bg-hud-cyan/10 border-hud-cyan/40',
      dot: 'bg-hud-cyan shadow-[0_0_6px_#00F0FF]'
    },
    MISSING: {
      color: 'text-text-dim bg-text-dim/10 border-text-dim/30',
      dot: 'bg-text-dim'
    },
    NOISY: {
      color: 'text-text-secondary bg-text-secondary/10 border-text-secondary/30',
      dot: 'bg-text-secondary'
    },
    OUTLIER: {
      color: 'text-hud-amber bg-hud-amber/10 border-hud-amber/40',
      dot: 'bg-hud-amber shadow-[0_0_6px_#F59E0B]'
    },
  }

  const s = String(status || 'NORMAL').toUpperCase()
  const config = configs[s] || {
    color: 'text-text-secondary bg-text-secondary/10 border-text-secondary/30',
    dot: 'bg-text-secondary'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider border rounded-xs ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse || s === 'CRITICAL' || s === 'WARNING' ? 'radar-dot' : ''}`} />
      {s}
    </span>
  )
}

