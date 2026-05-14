'use client'

export default function CourtChart({ zones = [], filter = 'all' }) {
  const filtered = zones.filter(z => {
    if (filter === '3pt') return ['corner_l','corner_r','wing_l','wing_r','top_key','deep_3'].includes(z.id)
    if (filter === 'paint') return z.id === 'paint'
    if (filter === 'hot') return z.fgPct >= 0.45
    return true
  })

  const isHot = (pct) => pct >= 0.50

  return (
    <svg viewBox="0 0 500 460" className="w-full max-w-[600px] max-h-full">
      <defs>
        <filter id="glow-hot">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-mid">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Court surface */}
      <rect width="500" height="460" fill="#f0f2f6"/>
      <rect x="15" y="10" width="470" height="440" fill="#fdf6e3" stroke="#c4a055" strokeWidth="1.5" rx="2"/>

      {/* Paint */}
      <rect x="190" y="248" width="120" height="192" fill="#f5ead0" stroke="#c4a055" strokeWidth="1.5"/>
      <line x1="214" y1="248" x2="214" y2="440" stroke="#c4a055" strokeWidth="1" opacity="0.5"/>
      <line x1="286" y1="248" x2="286" y2="440" stroke="#c4a055" strokeWidth="1" opacity="0.5"/>

      {/* FT line + circles */}
      <line x1="190" y1="248" x2="310" y2="248" stroke="#c4a055" strokeWidth="1.5"/>
      <path d="M 190 248 A 60 60 0 0 1 310 248" fill="none" stroke="#c4a055" strokeWidth="1.5"/>
      <path d="M 190 248 A 60 60 0 0 0 310 248" fill="none" stroke="#c4a055" strokeWidth="1.5" strokeDasharray="5,4"/>

      {/* Basket */}
      <line x1="230" y1="400" x2="270" y2="400" stroke="#8b6914" strokeWidth="2.5"/>
      <circle cx="250" cy="412" r="9" fill="none" stroke="#8b6914" strokeWidth="2"/>
      <path d="M 238 412 A 12 12 0 0 1 262 412" fill="none" stroke="#8b6914" strokeWidth="1.5"/>

      {/* 3pt arc */}
      <line x1="30" y1="440" x2="30" y2="391" stroke="#c4a055" strokeWidth="1.5"/>
      <line x1="470" y1="440" x2="470" y2="391" stroke="#c4a055" strokeWidth="1.5"/>
      <path d="M 30 391 A 221 221 0 0 1 470 391" fill="none" stroke="#c4a055" strokeWidth="1.5"/>

      {/* Zone labels */}
      {[
        { x: 250, y: 136, label: 'TOP OF KEY' },
        { x: 70,  y: 196, label: 'LEFT WING' },
        { x: 430, y: 196, label: 'RIGHT WING' },
        { x: 125, y: 320, label: 'MID-RANGE' },
        { x: 375, y: 320, label: 'MID-RANGE' },
        { x: 250, y: 348, label: 'PAINT' },
      ].map(({ x, y, label }) => (
        <text key={label+x} x={x} y={y} textAnchor="middle" fill="#c4a055"
          fontSize="8" fontFamily="sans-serif" fontWeight="700"
          letterSpacing="0.1em" opacity="0.7">{label}</text>
      ))}

      {/* Zone bubbles */}
      {filtered.map(zone => (
        <circle
          key={zone.id}
          cx={zone.center.x}
          cy={zone.center.y}
          r={zone.radius}
          fill={zone.color}
          opacity={0.82}
          filter={isHot(zone.fgPct) ? 'url(#glow-hot)' : zone.fgPct > 0.40 ? 'url(#glow-mid)' : undefined}
        >
          <title>{zone.label}: {Math.round(zone.fgPct * 100)}% ({zone.attempts} attempts)</title>
        </circle>
      ))}
    </svg>
  )
}
