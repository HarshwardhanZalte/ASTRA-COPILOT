export default function StatusBadge({ status, size = 'sm' }) {
  const colors = {
    NORMAL: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30',
    OK: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30',
    WARNING: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    WARN: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    CRITICAL: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
    ERROR: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
    HIGH: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
    MEDIUM: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    LOW: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30',
    OPEN: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    RESOLVED: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30',
    INFO: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30',
    MISSING: 'text-[#64748B] bg-[#64748B]/10 border-[#64748B]/30',
    NOISY: 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/30',
    OUTLIER: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  }
  const s = String(status).toUpperCase()
  const cls = colors[s] || 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/30'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold border rounded ${cls}`}>
      {s}
    </span>
  )
}
