export default function Panel({
  title,
  children,
  className = '',
  headerRight = null,
  compact = false,
  glow = false,
  showNotches = true
}) {
  return (
    <div className={`hud-panel rounded-sm ${glow ? 'hud-panel-glow' : ''} ${className}`}>
      {showNotches && (
        <>
          <div className="hud-corner-tl opacity-75" />
          <div className="hud-corner-br opacity-75" />
        </>
      )}
      {title && (
        <div className={`flex items-center justify-between border-b border-border/70 bg-bg-secondary/60 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-hud-cyan/80 rounded-xs shadow-[0_0_6px_#00F0FF]" />
            <div className="text-[10px] font-orbitron font-bold tracking-widest text-text-secondary uppercase">
              {title}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

