import { useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock } from 'lucide-react'

export default function TimeTravelScrubber({
  history = [],
  faultInjectedAt = null,
  onSelectFrame = null,
  selectedFrameIndex = null,
  isPlaying = false,
  onTogglePlay = null
}) {
  const max = Math.max(0, history.length - 1)
  const [currentIdx, setCurrentIdx] = useState(max)

  useEffect(() => {
    if (selectedFrameIndex != null) {
      setCurrentIdx(selectedFrameIndex)
    } else {
      setCurrentIdx(max)
    }
  }, [selectedFrameIndex, max])

  const handleSliderChange = (e) => {
    const idx = Number(e.target.value)
    setCurrentIdx(idx)
    if (onSelectFrame) onSelectFrame(idx)
  }

  const selectedPoint = history[currentIdx] || history[history.length - 1]
  const timeStr = selectedPoint?.timestamp
    ? new Date(selectedPoint.timestamp).toLocaleTimeString('en-US', { hour12: false })
    : '00:00:00'

  const jumpToFault = () => {
    if (faultInjectedAt != null && faultInjectedAt < history.length) {
      setCurrentIdx(faultInjectedAt)
      if (onSelectFrame) onSelectFrame(faultInjectedAt)
    }
  }

  const stepBack = () => {
    const next = Math.max(0, currentIdx - 1)
    setCurrentIdx(next)
    if (onSelectFrame) onSelectFrame(next)
  }

  const stepForward = () => {
    const next = Math.min(max, currentIdx + 1)
    setCurrentIdx(next)
    if (onSelectFrame) onSelectFrame(next)
  }

  const jumpToLive = () => {
    setCurrentIdx(max)
    if (onSelectFrame) onSelectFrame(null) // null indicates live stream
  }

  const isLive = selectedFrameIndex == null || selectedFrameIndex === max

  return (
    <div className="hud-panel p-3 border border-border bg-bg-panel/90 backdrop-blur-md rounded-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-hud-cyan" />
          <span className="text-[10px] font-orbitron font-bold tracking-wider text-text-secondary uppercase">
            TELEMETRY TIMELINE SCRUBBER
          </span>
          {isLive ? (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-hud-emerald border border-hud-emerald/40 bg-hud-emerald/10 rounded-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-hud-emerald shadow-[0_0_6px_#10B981] radar-dot" />
              LIVE
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-hud-amber border border-hud-amber/40 bg-hud-amber/10 rounded-xs">
              REPLAY (T-{max - currentIdx}s)
            </span>
          )}
        </div>

        {/* Time and fault pill */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {faultInjectedAt != null && (
            <button
              onClick={jumpToFault}
              className="text-[9px] px-2 py-0.5 border border-status-error/50 text-status-error bg-status-error/10 hover:bg-status-error/20 rounded-xs transition-colors flex items-center gap-1 font-bold"
            >
              JUMP TO FAULT
            </button>
          )}
          <span className="text-text-dim text-[11px]">FRAME: <span className="text-text-primary font-bold">{currentIdx + 1}/{history.length}</span></span>
          <span className="text-hud-cyan font-bold tracking-wider text-sm">{timeStr} UTC</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative flex items-center w-full my-1">
        <input
          type="range"
          min="0"
          max={max}
          value={currentIdx}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-hud-cyan focus:outline-none"
        />

        {/* Fault Marker Indicator on Slider */}
        {faultInjectedAt != null && max > 0 && (
          <div
            className="absolute top-0 w-1.5 h-3.5 bg-status-error -translate-y-1 rounded-xs pointer-events-none shadow-[0_0_6px_#EF4444]"
            style={{ left: `${(faultInjectedAt / max) * 100}%` }}
            title="Fault Injected Point"
          />
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/50 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={stepBack}
            className="p-1.5 text-text-secondary hover:text-hud-cyan hover:bg-bg-panel rounded-xs border border-border/60 transition-colors"
            title="Step Back 1 Sec"
          >
            <SkipBack size={12} />
          </button>
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="p-1.5 text-text-secondary hover:text-hud-cyan hover:bg-bg-panel rounded-xs border border-border/60 transition-colors"
              title={isPlaying ? 'Pause Replay' : 'Play Replay'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          )}
          <button
            onClick={stepForward}
            className="p-1.5 text-text-secondary hover:text-hud-cyan hover:bg-bg-panel rounded-xs border border-border/60 transition-colors"
            title="Step Forward 1 Sec"
          >
            <SkipForward size={12} />
          </button>
        </div>

        <button
          onClick={jumpToLive}
          disabled={isLive}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-xs border transition-all ${
            isLive
              ? 'border-border/40 text-text-dim opacity-50 cursor-default'
              : 'border-hud-cyan text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 shadow-hud-cyan cursor-pointer'
          }`}
        >
          <RotateCcw size={10} /> RESUME LIVE STREAM
        </button>
      </div>
    </div>
  )
}
