import React from 'react'

export default function Sparkline({
  data = [],
  field,
  width = 70,
  height = 18,
  color = '#38BDF8',
  status = 'NORMAL',
  selectedFrame = null
}) {
  const windowSize = 25
  const rawPoints = data
    .map(d => d[field])
    .filter(v => v !== null && v !== undefined && !isNaN(v))

  if (rawPoints.length < 2) {
    return <div className="w-[70px] h-[18px] bg-bg-secondary/40 rounded-xs" />
  }

  const points = rawPoints.slice(-windowSize)
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const strokeColor =
    status === 'CRITICAL' ? '#EF4444' :
    status === 'WARNING' ? '#F59E0B' :
    color

  // Calculate index for dot (selectedFrame mapped to window, or latest)
  let dotIdx = points.length - 1
  if (selectedFrame != null && selectedFrame >= 0 && selectedFrame < data.length) {
    const offsetFromEnd = data.length - 1 - selectedFrame
    const candidateIdx = points.length - 1 - offsetFromEnd
    if (candidateIdx >= 0 && candidateIdx < points.length) {
      dotIdx = candidateIdx
    }
  }

  const svgPoints = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (width - 4) + 2
      const y = height - 2 - ((v - min) / range) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const dotVal = points[dotIdx]
  const dotX = (dotIdx / (points.length - 1)) * (width - 4) + 2
  const dotY = height - 2 - ((dotVal - min) / range) * (height - 6)

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={svgPoints}
      />
      {dotVal != null && (
        <circle
          cx={dotX.toFixed(1)}
          cy={dotY.toFixed(1)}
          r={selectedFrame != null ? '2.5' : '2'}
          fill={selectedFrame != null ? '#00F0FF' : strokeColor}
          stroke={selectedFrame != null ? '#FFFFFF' : 'none'}
          strokeWidth={selectedFrame != null ? '0.75' : '0'}
        />
      )}
    </svg>
  )
}
