'use client'

const ORANGE = '#F57B20'

const SEGS = [
  { key: 'paint', label: 'Paint',  color: '#3b82f6' },
  { key: 'three', label: '3-PT',   color: ORANGE },
  { key: 'mid',   label: 'Mid',    color: '#a855f7' },
  { key: 'ft',    label: 'FT',     color: '#22c55e' },
]

export default function DonutChart({ stats, zones }) {
  if (!stats?.PTS) return null

  const pts    = stats.PTS    || 0
  const ftPts  = stats.FTM    || 0
  const thrPts = (stats.FG3M  || 0) * 3
  const twoPts = Math.max(0, pts - ftPts - thrPts)

  const paintZone  = zones?.find(z => z.id === 'paint')
  const totalFGA   = zones?.reduce((s, z) => s + (z.fga || 0), 0) || 1
  const paintRatio = Math.min(0.85, Math.max(0.3, (paintZone?.fga || 0) / totalFGA))

  const values = {
    paint: twoPts * paintRatio,
    three: thrPts,
    mid:   twoPts * (1 - paintRatio),
    ft:    ftPts,
  }

  const r = 50, cx = 65, cy = 65
  const circ = 2 * Math.PI * r
  let startFrac = 0

  const arcs = SEGS.map(seg => {
    const frac   = pts > 0 ? values[seg.key] / pts : 0
    const dash   = frac * circ
    const offset = circ / 4 - startFrac * circ
    startFrac   += frac
    return { ...seg, frac, dash, gap: circ - dash, offset }
  })

  return (
    <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
      <div className="text-[9px] font-black tracking-widest uppercase mb-3" style={{ color: '#aaa' }}>Points Breakdown</div>
      <div className="flex items-center gap-4">
        <svg width="130" height="130" viewBox="0 0 130 130" className="flex-shrink-0">
          <defs>
            <filter id="donut-glow">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="16"/>
          {arcs.map(arc => arc.frac > 0.01 && (
            <circle key={arc.key} cx={cx} cy={cy} r={r}
              fill="none" stroke={arc.color} strokeWidth="16"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              filter="url(#donut-glow)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0f0f0"
            fontSize="18" fontWeight="900" fontFamily="system-ui,sans-serif">
            {pts.toFixed(1)}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#444"
            fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.14em">
            PPG
          </text>
        </svg>

        <div className="flex-1 space-y-2">
          {arcs.map(arc => (
            <div key={arc.key} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: arc.color, boxShadow: `0 0 6px ${arc.color}` }}/>
              <span className="text-[10px] flex-1" style={{ color: '#888' }}>{arc.label}</span>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                <div className="h-full rounded-full" style={{ width: `${arc.frac * 100}%`, background: arc.color }}/>
              </div>
              <span className="text-[10px] font-black w-7 text-right" style={{ color: arc.color }}>
                {Math.round(arc.frac * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
