import StatusBadge from './StatusBadge'

export default function SystemHealthBar({ subsystems }) {
  if (!subsystems) return null
  
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(subsystems).map(([name, score]) => {
        const status = score >= 0.7 ? 'CRITICAL' : score >= 0.4 ? 'WARNING' : 'NORMAL'
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase">{name}</span>
            <div className="w-16 h-1 bg-[#263142] rounded overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.round(score * 100)}%`,
                  background: score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#22C55E'
                }}
              />
            </div>
            <StatusBadge status={status} />
          </div>
        )
      })}
    </div>
  )
}
