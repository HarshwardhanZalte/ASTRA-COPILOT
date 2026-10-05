export default function Panel({ title, children, className = '', headerRight = null, compact = false }) {
  return (
    <div className={`border border-[#263142] bg-[#111722] ${className}`}>
      {title && (
        <div className={`flex items-center justify-between border-b border-[#263142] ${compact ? 'px-3 py-2' : 'px-4 py-2.5'}`}>
          <div className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}
