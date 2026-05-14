'use client'
import { useState } from 'react'

export default function CourtChart({ zones = [], filter = 'all' }) {
  const [hovered, setHovered] = useState(null)

  const filtered = zones.filter(z => {
    if (filter === '3pt')   return ['corner_l','corner_r','wing_l','wing_r','top_key','deep_3'].includes(z.id)
    if (filter === 'paint') return z.id === 'paint'
    if (filter === 'hot')   return z.fgPct >= 0.45
    return true
  })

  const lineColor = '#c4a055'
  const bgColor   = '#fdf6e3'

  return (
    <div className="relative w-full max-w-[620px] select-none">
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

        {/* Court */}
        <rect width="500" height="460" fill="#f0f2f6"/>
        <rect x="15" y="10" width="470" height="440" fill={bgColor} stroke={lineColor} strokeWidth="1.5" rx="3"/>

        {/* Paint */}
        <rect x="190" y="248" width="120" height="192" fill="#f5ead0" stroke={lineColor} strokeWidth="1.5"/>
        <line x1="214" y1="248" x2="214" y2="440" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>
        <line x1="286" y1="248" x2="286" y2="440" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>

        {/* FT line */}
        <line x1="190" y1="248" x2="310" y2="248" stroke={lineColor} strokeWidth="1.5"/>
        <path d="M 190 248 A 60 60 0 0 1 310 248" fill="none" stroke={lineColor} strokeWidth="1.5"/>
        <path d="M 190 248 A 60 60 0 0 0 310 248" fill="none" stroke={lineColor} strokeWidth="1.5" strokeDasharray="5,4"/>

        {/* Basket */}
        <line x1="230" y1="400" x2="270" y2="400" stroke="#8b6914" strokeWidth="2.5"/>
        <circle cx="250" cy="412" r="9" fill="none" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 238 412 A 12 12 0 0 1 262 412" fill="none" stroke="#8b6914" strokeWidth="1.5"/>

        {/* 3pt arc */}
        <line x1="30" y1="440" x2="30" y2="391" stroke={lineColor} strokeWidth="1.5"/>
        <line x1="470" y1="440" x2="470" y2="391" stroke={lineColor} strokeWidth="1.5"/>
        <path d="M 30 391 A 221 221 0 0 1 470 391" fill="none" stroke={lineColor} strokeWidth="1.5"/>

        {/* Zone labels */}
        {[
          { x: 250, y: 136, label: 'TOP OF KEY' },
          { x: 70,  y: 200, label: 'LEFT WING'  },
          { x: 430, y: 200, label: 'RIGHT WING' },
          { x: 125, y: 320, label: 'MID-RANGE'  },
          { x: 375, y: 320, label: 'MID-RANGE'  },
          { x: 250, y: 348, label: 'PAINT'      },
        ].map(({ x, y, label }) => (
          <text key={label+x} x={x} y={y} textAnchor="middle"
            fill={lineColor} fontSize="7.5"
            fontFamily="system-ui,sans-serif" fontWeight="700"
            letterSpacing="0.12em" opacity="0.7">
            {label}
          </text>
        ))}

        {/* Bubbles */}
        {filtered.map(zone => {
          const isHot = zone.fgPct >= 0.50
          const isMid = zone.fgPct >= 0.40
          const pct   = Math.round(zone.fgPct * 100)
          const isHov = hovered === zone.id

          return (
            <g key={zone.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(zone.id)}
              onMouseLeave={() => setHovered(null)}>

              {isHov && (
                <circle cx={zone.center.x} cy={zone.center.y}
                  r={zone.radius + 6} fill="none"
                  stroke={zone.color} strokeWidth="1.5" opacity="0.4"/>
              )}

              <circle
                cx={zone.center.x} cy={zone.center.y}
                r={isHov ? zone.radius + 2 : zone.radius}
                fill={zone.color} opacity={isHov ? 0.95 : 0.82}
                filter={isHot ? 'url(#glow-hot)' : isMid ? 'url(#glow-mid)' : undefined}
                style={{ transition: 'r 0.15s, opacity 0.15s' }}
              />

              {zone.radius >= 9 && (
                <text x={zone.center.x} y={zone.center.y + 4}
                  textAnchor="middle" fill="white"
                  fontSize={zone.radius >= 12 ? "8" : "6.5"}
                  fontFamily="system-ui,sans-serif" fontWeight="800"
                  style={{ pointerEvents: 'none' }}>
                  {pct}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hovered && (() => {
        const z = filtered.find(x => x.id === hovered)
        if (!z) return null
        return (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xl pointer-events-none z-10 whitespace-nowrap">
            <div className="text-gray-900 font-bold text-sm">{z.label}</div>
            <div className="flex gap-4 mt-1">
              <span className="text-[12px] font-semibold" style={{ color: z.color }}>{Math.round(z.fgPct * 100)}% FG</span>
              <span className="text-[12px] text-gray-500">{z.fga?.toFixed?.(1) ?? z.attempts} att/g</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
