'use client'
import { useState } from 'react'

// LOC_X: -250 to 250, LOC_Y: -50 to 400 (tenths of feet, basket at 0,0)
// SVG: 500x460, basket at (250, 412), 470px playable width
// factor: 470/500 = 0.94 (use 0.86 for slight inset)
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

  const lineColor = '#F57B20'
  const bgColor   = '#0a0a0a'

  const filteredShots = shots.filter(s => {
    if (filter === '3pt')   return Math.sqrt(s.x * s.x + s.y * s.y) > 200 || (Math.abs(s.x) >= 220 && s.y < 90)
    if (filter === 'paint') return Math.abs(s.x) <= 80 && s.y >= -10 && s.y <= 190
    return true
  })
  const mapped = filteredShots.map(mapShot).filter(s => s.sx >= 15 && s.sx <= 485 && s.sy >= 10 && s.sy <= 450)

  return (
    <div className={`relative w-full select-none ${compact ? 'max-w-full' : 'max-w-[620px]'}`}>
      <svg viewBox="0 0 500 460" className="w-full">
        <defs>
          <filter id="glow-hot">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-mid">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <defs>
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Court */}
        <rect width="500" height="460" fill="#0d0d0d"/>
        <rect x="15" y="10" width="470" height="440" fill={bgColor} stroke={lineColor} strokeWidth="1.5" rx="3" filter="url(#line-glow)"/>

        {/* Paint */}
        <rect x="190" y="248" width="120" height="192" fill="#F57B2008" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>
        <line x1="214" y1="248" x2="214" y2="440" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="286" y1="248" x2="286" y2="440" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>

        {/* FT line */}
        <line x1="190" y1="248" x2="310" y2="248" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>
        <path d="M 190 248 A 60 60 0 0 1 310 248" fill="none" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>
        <path d="M 190 248 A 60 60 0 0 0 310 248" fill="none" stroke={lineColor} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.5"/>

        {/* Basket */}
        <line x1="230" y1="400" x2="270" y2="400" stroke={lineColor} strokeWidth="2.5" filter="url(#line-glow)"/>
        <circle cx="250" cy="412" r="9" fill="none" stroke={lineColor} strokeWidth="2" filter="url(#line-glow)"/>
        <path d="M 238 412 A 12 12 0 0 1 262 412" fill="none" stroke={lineColor} strokeWidth="1.5" opacity="0.6"/>

        {/* 3pt arc */}
        <line x1="30" y1="440" x2="30" y2="391" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>
        <line x1="470" y1="440" x2="470" y2="391" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>
        <path d="M 30 391 A 221 221 0 0 1 470 391" fill="none" stroke={lineColor} strokeWidth="1.5" filter="url(#line-glow)"/>

        {view === 'zones' && (
          <>
            {[
              { x: 250, y: 136, label: 'TOP OF KEY' },
              { x: 70,  y: 200, label: 'LEFT WING'  },
              { x: 430, y: 200, label: 'RIGHT WING' },
              { x: 125, y: 320, label: 'MID-RANGE'  },
              { x: 375, y: 320, label: 'MID-RANGE'  },
              { x: 250, y: 348, label: 'PAINT'      },
            ].map(({ x, y, label }) => (
              <text key={label+x} x={x} y={y} textAnchor="middle"
                fill="#F57B2066" fontSize="7.5"
                fontFamily="system-ui,sans-serif" fontWeight="700"
                letterSpacing="0.12em" opacity="0.7">
                {label}
              </text>
            ))}

            {filteredZones.map(zone => {
              const pct   = Math.round(zone.fgPct * 100)
              const isHov = hovered === zone.id
              const dotColor = '#F57B20'
              const r = isHov ? zone.radius + 2 : zone.radius

              return (
                <g key={zone.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}>
                  {isHov && (
                    <circle cx={zone.center.x} cy={zone.center.y}
                      r={r + 6} fill="none"
                      stroke={dotColor} strokeWidth="1.5" opacity="0.4"/>
                  )}
                  <circle
                    cx={zone.center.x} cy={zone.center.y}
                    r={r}
                    fill={dotColor} opacity={isHov ? 0.95 : 0.82}
                    filter="url(#glow-mid)"
                    style={{ transition: 'r 0.15s, opacity 0.15s' }}
                  />
                  <text x={zone.center.x} y={zone.center.y + 4}
                    textAnchor="middle" fill="white"
                    fontSize={r >= 12 ? "8" : r >= 9 ? "6.5" : "5.5"}
                    fontFamily="system-ui,sans-serif" fontWeight="800"
                    style={{ pointerEvents: 'none' }}>
                    {pct}%
                  </text>
                </g>
              )
            })}
          </>
        )}

        {view === 'shots' && mapped.map((s, i) => s.m ? (
          <circle key={i} cx={s.sx} cy={s.sy} r="3" fill="#16a34a" opacity="0.85"/>
        ) : (
          <g key={i} opacity="0.7">
            <line x1={s.sx - 3} y1={s.sy - 3} x2={s.sx + 3} y2={s.sy + 3} stroke="#b91c1c" strokeWidth="1.5"/>
            <line x1={s.sx - 3} y1={s.sy + 3} x2={s.sx + 3} y2={s.sy - 3} stroke="#b91c1c" strokeWidth="1.5"/>
          </g>
        ))}

        {view === 'shots' && shots.length === 0 && (
          <text x="250" y="220" textAnchor="middle" fill="#555"
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
            style={{ background: '#161616', border: '1px solid #F57B2040', boxShadow: '0 0 20px #F57B2020' }}>
            <div className="text-sm font-bold" style={{ color: '#f0f0f0' }}>{z.label}</div>
            <div className="flex gap-4 mt-1">
              <span className="text-[12px] font-semibold" style={{ color: z.color }}>{Math.round(z.fgPct * 100)}% FG</span>
              <span className="text-[12px]" style={{ color: '#777' }}>{z.fga?.toFixed?.(1) ?? z.attempts} att/g</span>
            </div>
          </div>
        )
      })()}

      {view === 'shots' && (
        <div className="absolute top-2 right-2 rounded-lg px-2.5 py-1.5 text-[10px] flex gap-3"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <span className="flex items-center gap-1" style={{ color: '#bbb' }}><span className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }}/>Made {filteredShots.filter(s => s.m).length}</span>
          <span className="flex items-center gap-1" style={{ color: '#bbb' }}><span style={{ color: '#b91c1c', fontWeight: 'bold' }}>×</span>Missed {filteredShots.filter(s => !s.m).length}</span>
        </div>
      )}
    </div>
  )
}
