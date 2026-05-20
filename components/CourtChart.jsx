'use client'
import { useState } from 'react'

const FX = 0.86, BX = 250, BY = 412

function mapShot(s) {
  return { sx: BX + s.x * FX, sy: BY - s.y * FX, m: s.m }
}

export default function CourtChart({ zones = [], shots = [], filter = 'all', view = 'zones', compact = false }) {
  const [hovered, setHovered] = useState(null)

  const filteredZones = zones.filter(z => {
    if (filter === '3pt')   return ['corner_l','corner_r','wing_l','wing_r','top_key','deep_3'].includes(z.id)
    if (filter === 'paint') return z.id === 'paint'
    if (filter === 'hot')   return z.fgPct >= 0.45
    return true
  })

  const LINE = '#F57B20'

  const filteredShots = shots.filter(s => {
    if (filter === '3pt')   return Math.sqrt(s.x * s.x + s.y * s.y) > 200 || (Math.abs(s.x) >= 220 && s.y < 90)
    if (filter === 'paint') return Math.abs(s.x) <= 80 && s.y >= -10 && s.y <= 190
    return true
  })
  const mapped = filteredShots.map(mapShot).filter(s => s.sx >= 15 && s.sx <= 485 && s.sy >= 10 && s.sy <= 450)

  return (
    <div className={`relative w-full select-none ${compact ? 'max-w-full' : 'max-w-[620px]'}`}>
      <style>{`
        @keyframes dot-pulse {
          0%,100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        .zone-dot { animation: dot-pulse 2.5s ease-in-out infinite; }
      `}</style>

      <svg viewBox="0 0 500 460" className="w-full">
        <defs>
          {/* Glows */}
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-med" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-dot" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-shot" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Floor ambient glow — orange radial from basket */}
          <radialGradient id="floor-glow" cx="50%" cy="90%" r="60%">
            <stop offset="0%"   stopColor="#F57B20" stopOpacity="0.12"/>
            <stop offset="40%"  stopColor="#F57B20" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#F57B20" stopOpacity="0"/>
          </radialGradient>

          {/* Paint ambient fill */}
          <radialGradient id="paint-glow" cx="50%" cy="80%" r="70%">
            <stop offset="0%"   stopColor="#F57B20" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#F57B20" stopOpacity="0"/>
          </radialGradient>

          {/* Corner vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="50%"  stopColor="#0d0d0d" stopOpacity="0"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.7"/>
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="500" height="460" fill="#080808"/>

        {/* Court floor */}
        <rect x="15" y="10" width="470" height="440" fill="#0c0c0c" rx="4"/>

        {/* Ambient floor glow */}
        <rect x="15" y="10" width="470" height="440" fill="url(#floor-glow)" rx="4"/>

        {/* Court border — glowing */}
        <rect x="15" y="10" width="470" height="440" fill="none"
          stroke={LINE} strokeWidth="2" rx="4" filter="url(#glow-strong)"/>

        {/* Paint fill */}
        <rect x="190" y="248" width="120" height="192" fill="url(#paint-glow)"/>

        {/* Paint box */}
        <rect x="190" y="248" width="120" height="192" fill="none"
          stroke={LINE} strokeWidth="2" filter="url(#glow-med)"/>

        {/* Lane lines (inner) */}
        <line x1="214" y1="248" x2="214" y2="440" stroke={LINE} strokeWidth="0.8" opacity="0.25"/>
        <line x1="286" y1="248" x2="286" y2="440" stroke={LINE} strokeWidth="0.8" opacity="0.25"/>

        {/* Elbow hash marks */}
        {[270, 298, 326, 354, 382].map(y => (
          <g key={y}>
            <line x1="190" y1={y} x2="198" y2={y} stroke={LINE} strokeWidth="1" opacity="0.4"/>
            <line x1="302" y1={y} x2="310" y2={y} stroke={LINE} strokeWidth="1" opacity="0.4"/>
          </g>
        ))}

        {/* FT line */}
        <line x1="190" y1="248" x2="310" y2="248" stroke={LINE} strokeWidth="2" filter="url(#glow-med)"/>

        {/* FT circle top (solid) */}
        <path d="M 190 248 A 60 60 0 0 1 310 248" fill="none"
          stroke={LINE} strokeWidth="2" filter="url(#glow-med)"/>

        {/* FT circle bottom (dashed) */}
        <path d="M 190 248 A 60 60 0 0 0 310 248" fill="none"
          stroke={LINE} strokeWidth="1.5" strokeDasharray="6,5" opacity="0.35"/>

        {/* Restricted area arc */}
        <path d="M 233 412 A 17 17 0 0 1 267 412" fill="none"
          stroke={LINE} strokeWidth="1.5" opacity="0.6" filter="url(#glow-med)"/>

        {/* Backboard */}
        <line x1="226" y1="397" x2="274" y2="397" stroke={LINE} strokeWidth="3" filter="url(#glow-strong)"/>

        {/* Basket */}
        <circle cx="250" cy="412" r="10" fill="none" stroke={LINE} strokeWidth="2.5" filter="url(#glow-strong)"/>

        {/* 3pt corner lines */}
        <line x1="30" y1="440" x2="30" y2="388" stroke={LINE} strokeWidth="2" filter="url(#glow-med)"/>
        <line x1="470" y1="440" x2="470" y2="388" stroke={LINE} strokeWidth="2" filter="url(#glow-med)"/>

        {/* 3pt arc */}
        <path d="M 30 388 A 224 224 0 0 1 470 388" fill="none"
          stroke={LINE} strokeWidth="2" filter="url(#glow-strong)"/>

        {/* Vignette overlay */}
        <rect x="15" y="10" width="470" height="440" fill="url(#vignette)" rx="4"/>

        {view === 'zones' && (
          <>
            {/* Zone labels */}
            {[
              { x: 250, y: 120, label: 'TOP OF KEY' },
              { x: 68,  y: 195, label: 'LEFT WING'  },
              { x: 432, y: 195, label: 'RIGHT WING' },
              { x: 118, y: 325, label: 'MID-RANGE'  },
              { x: 382, y: 325, label: 'MID-RANGE'  },
              { x: 250, y: 345, label: 'PAINT'      },
            ].map(({ x, y, label }) => (
              <text key={label+x} x={x} y={y} textAnchor="middle"
                fill="#F57B20" fontSize="7" opacity="0.35"
                fontFamily="system-ui,sans-serif" fontWeight="800" letterSpacing="0.14em">
                {label}
              </text>
            ))}

            {filteredZones.map(zone => {
              const pct   = Math.round(zone.fgPct * 100)
              const isHov = hovered === zone.id
              const r     = isHov ? zone.radius + 3 : zone.radius

              return (
                <g key={zone.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}>

                  {/* Outer pulse ring */}
                  <circle cx={zone.center.x} cy={zone.center.y}
                    r={r + 8} fill="none"
                    stroke={LINE} strokeWidth="1" opacity={isHov ? 0.5 : 0.15}
                    style={{ transition: 'opacity 0.2s' }}/>

                  {/* Dot */}
                  <circle cx={zone.center.x} cy={zone.center.y} r={r}
                    fill={LINE} className="zone-dot"
                    filter="url(#glow-dot)"
                    style={{ transition: 'r 0.15s' }}/>

                  {/* Inner bright core */}
                  <circle cx={zone.center.x} cy={zone.center.y} r={r * 0.55}
                    fill="white" opacity="0.25" style={{ pointerEvents: 'none' }}/>

                  {/* Percentage */}
                  <text x={zone.center.x} y={zone.center.y + 4}
                    textAnchor="middle" fill="white"
                    fontSize={r >= 13 ? "9" : r >= 10 ? "7.5" : "6"}
                    fontFamily="system-ui,sans-serif" fontWeight="900"
                    style={{ pointerEvents: 'none' }}>
                    {pct}%
                  </text>
                </g>
              )
            })}
          </>
        )}

        {view === 'shots' && mapped.map((s, i) => s.m ? (
          <circle key={i} cx={s.sx} cy={s.sy} r="3.5" fill="#16a34a"
            filter="url(#glow-shot)" opacity="0.9"/>
        ) : (
          <g key={i} opacity="0.75" filter="url(#glow-shot)">
            <line x1={s.sx-3.5} y1={s.sy-3.5} x2={s.sx+3.5} y2={s.sy+3.5} stroke="#ef4444" strokeWidth="1.8"/>
            <line x1={s.sx-3.5} y1={s.sy+3.5} x2={s.sx+3.5} y2={s.sy-3.5} stroke="#ef4444" strokeWidth="1.8"/>
          </g>
        ))}

        {view === 'shots' && shots.length === 0 && (
          <text x="250" y="220" textAnchor="middle" fill="#333"
            fontSize="11" fontFamily="system-ui,sans-serif">
            Shot tracking not available for this player
          </text>
        )}
      </svg>

      {view === 'zones' && hovered && (() => {
        const z = filteredZones.find(x => x.id === hovered)
        if (!z) return null
        return (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2.5 pointer-events-none z-10 whitespace-nowrap"
            style={{ background: '#111', border: `1px solid ${LINE}50`, boxShadow: `0 0 30px ${LINE}25` }}>
            <div className="text-sm font-black" style={{ color: '#f0f0f0' }}>{z.label}</div>
            <div className="flex gap-4 mt-1">
              <span className="text-[12px] font-bold" style={{ color: LINE }}>{Math.round(z.fgPct * 100)}% FG</span>
              <span className="text-[12px]" style={{ color: '#555' }}>{z.fga?.toFixed?.(1) ?? z.attempts} att/g</span>
            </div>
          </div>
        )
      })()}

      {view === 'shots' && (
        <div className="absolute top-2 right-2 rounded-lg px-2.5 py-1.5 text-[10px] flex gap-3"
          style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <span className="flex items-center gap-1.5" style={{ color: '#bbb' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#16a34a', boxShadow: '0 0 6px #16a34a' }}/>
            Made {filteredShots.filter(s => s.m).length}
          </span>
          <span className="flex items-center gap-1.5" style={{ color: '#bbb' }}>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>×</span>
            Missed {filteredShots.filter(s => !s.m).length}
          </span>
        </div>
      )}
    </div>
  )
}
