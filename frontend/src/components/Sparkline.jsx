import React from 'react'

export default function Sparkline({
  data = [],
  field,
  width = 70,
  height = 18,
  color = '#38BDF8',
  status = 'NORMAL'
}) {
  const points = data
    .map(d => d[field])
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .slice(-25)

  if (points.length < 2) {
    return <div className="w-[70px] h-[18px] bg-bg-secondary/40 rounded-xs" />
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const strokeColor =
    status === 'CRITICAL' ? '#EF4444' :
    status === 'WARNING' ? '#F59E0B' :
    color

  const svgPoints = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (width - 4) + 2
      const y = height - 2 - ((v - min) / range) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

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
      {points.length > 0 && (
        <circle
          cx={(width - 2).toFixed(1)}
          cy={(height - 2 - ((points[points.length - 1] - min) / range) * (height - 6)).toFixed(1)}
          r="2"
          fill={strokeColor}
        />
      )}
    </svg>
  )
}
