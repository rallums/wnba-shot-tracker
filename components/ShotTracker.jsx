'use client'

import { useState, useEffect, useCallback } from 'react'
import CourtChart from './CourtChart'

const FALLBACK_ZONES = [
  { id: 'paint',    label: 'Paint',       attempts: 95, makes: 65, fgPct: 0.68, color: '#c0392b', radius: 20, center: { x: 250, y: 370 } },
  { id: 'top_key',  label: 'Top of Key',  attempts: 72, makes: 32, fgPct: 0.44, color: '#f77f00', radius: 16, center: { x: 250, y: 195 } },
  { id: 'corner_l', label: 'Corner 3 L',  attempts: 28, makes: 12, fgPct: 0.43, color: '#f77f00', radius: 10, center: { x: 42,  y: 418 } },
  { id: 'corner_r', label: 'Corner 3 R',  attempts: 24, makes: 10, fgPct: 0.42, color: '#f8b500', radius: 9,  center: { x: 458, y: 418 } },
  { id: 'wing_l',   label: 'Wing 3 L',    attempts: 45, makes: 18, fgPct: 0.40, color: '#f8b500', radius: 12, center: { x: 95,  y: 290 } },
  { id: 'wing_r',   label: 'Wing 3 R',    attempts: 42, makes: 16, fgPct: 0.38, color: '#f8b500', radius: 12, center: { x: 405, y: 290 } },
  { id: 'mid_l',    label: 'Mid-Range L', attempts: 18, makes: 6,  fgPct: 0.33, color: '#4cc9f0', radius: 7,  center: { x: 165, y: 275 } },
  { id: 'mid_r',    label: 'Mid-Range R', attempts: 16, makes: 5,  fgPct: 0.31, color: '#4cc9f0', radius: 7,  center: { x: 335, y: 275 } },
  { id: 'deep_3',   label: 'Deep 3',      attempts: 12, makes: 3,  fgPct: 0.25, color: '#3a86ff', radius: 6,  center: { x: 250, y: 158 } },
]

const DEFAULT_PLAYER = { id: '1630710', name: 'Caitlin Clark', team: 'Indiana Fever', abbr: 'IND' }

const ZONE_ORDER = ['paint','top_key','corner_l','corner_r','wing_l','wing_r','mid_l','mid_r','deep_3']

export default function ShotTracker({ initialPlayers = [] }) {
  const [player, setPlayer]   = useState(DEFAULT_PLAYER)
  const [zones, setZones]     = useState(FALLBACK_ZONES)
  const [stats, setStats]     = useState(null)
  const [filter, setFilter]   = useState('all')
  const [query, setQuery]     = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const filteredPlayers = initialPlayers.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  const loadPlayer = useCallback(async (p) => {
    setPlayer(p)
    setQuery('')
    setShowDrop(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/player/${p.id}`)
      const data = await res.json()
      if (data.zones?.length) setZones(data.zones)
      if (data.stats) setStats(data.stats)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch('/api/player/' + DEFAULT_PLAYER.id)
      .then(r => r.json())
      .then(data => {
        if (data.zones?.length) setZones(data.zones)
        if (data.stats) setStats(data.stats)
      })
      .catch(() => {})

    fetch('/api/meta').then(r => r.json()).then(d => setLastUpdated(d.lastUpdated)).catch(() => {})
  }, [])

  const statDisplay = [
    { val: stats?.PTS   ?? '22.4', lbl: 'PPG' },
    { val: stats?.FG_PCT ? (stats.FG_PCT * 100).toFixed(1) : '46.3', lbl: 'FG%' },
    { val: stats?.FG3_PCT ? (stats.FG3_PCT * 100).toFixed(1) : '41.2', lbl: '3P%' },
    { val: stats?.AST   ?? '8.1',  lbl: 'AST' },
  ]

  const leaderboardZones = [...zones].sort((a, b) => b.fgPct - a.fgPct)

  return (
    <div className="flex h-[calc(100vh-54px)] overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-[300px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dashboard</span>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                ● Updated Mondays
              </span>
            )}
            <button className="w-7 h-7 bg-[#1e2d7d] text-white rounded-md text-xs font-bold">«</button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
            <input
              className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 text-sm outline-none focus:border-[#1e2d7d] focus:bg-white"
              placeholder="Search player..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            />
            {showDrop && filteredPlayers.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {filteredPlayers.map(p => (
                  <div key={p.id} onMouseDown={() => loadPlayer(p)}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-[9px] font-bold text-[#FF6900]">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-400">{p.team}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Season stats */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">2026 Season Overview</div>
          <div className="grid grid-cols-2 gap-2">
            {statDisplay.map(({ val, lbl }, i) => (
              <div key={lbl} className="border border-gray-200 rounded-lg p-3 text-center">
                <div className={`text-2xl font-extrabold ${i === 0 ? 'text-[#FF6900]' : i === 1 ? 'text-green-700' : 'text-gray-900'}`}>{val}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone leaderboard */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Top 3P% Leaders · 2026</div>
          <div className="space-y-0.5">
            {leaderboardZones.slice(0, 5).map((z, i) => (
              <div key={z.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <span className="text-[11px] text-gray-400 w-3">{i + 1}</span>
                <span className="flex-1 text-[13px] font-semibold text-gray-900">{z.label}</span>
                <div className="w-14 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                </div>
                <span className="text-[13px] font-bold text-gray-900 w-9 text-right">{Math.round(z.fgPct * 100)}%</span>
              </div>
            ))}
          </div>
          <span className="text-[12px] font-bold text-[#FF6900] mt-2 inline-block cursor-pointer">View all players →</span>
        </div>

        {/* Zones by efficiency */}
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Zones by Efficiency</div>
          <div className="space-y-2">
            {ZONE_ORDER.map(id => {
              const z = zones.find(x => x.id === id)
              if (!z) return null
              const tag = z.fgPct >= 0.45 ? { label: `+${Math.round((z.fgPct - 0.37) * 100)}`, cls: 'bg-red-50 text-red-600' }
                        : z.fgPct >= 0.38 ? { label: 'AVG', cls: 'bg-gray-100 text-gray-400' }
                        : { label: `−${Math.round((0.37 - z.fgPct) * 100)}`, cls: 'bg-blue-50 text-blue-500' }
              return (
                <div key={id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: z.color }}/>
                  <span className="flex-1 text-[12px] text-gray-600">{z.label}</span>
                  <div className="w-14 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                  </div>
                  <span className="text-[11px] font-bold w-7 text-right" style={{ color: z.color }}>{Math.round(z.fgPct * 100)}%</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-7 text-center ${tag.cls}`}>{tag.label}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <p className="text-sm text-gray-600 text-center mb-2.5">
            Shot zones for <strong className="text-gray-900">{player.name} · {player.team}</strong> — 2026 WNBA Season
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1 bg-white text-xs text-gray-600">
              <span>Cold</span>
              <div className="flex gap-0.5">
                {['#3a86ff','#4895ef','#4cc9f0','#72efdd','#c5e77a','#f8b500','#f4a261','#f77f00','#e63946','#c0392b'].map(c => (
                  <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }}/>
                ))}
              </div>
              <span>Hot</span>
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1 bg-white text-xs text-gray-600">
              <span>Frequency</span>
              <svg width="68" height="14">
                <circle cx="7" cy="7" r="3.5" fill="#9aa3b8"/>
                <circle cx="20" cy="7" r="5" fill="#9aa3b8"/>
                <circle cx="36" cy="7" r="6.5" fill="#9aa3b8"/>
                <circle cx="55" cy="7" r="8" fill="#9aa3b8"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex justify-center gap-1.5 py-2.5 flex-shrink-0">
          {[['all','All Zones'],['3pt','3-Pointers'],['paint','Paint'],['hot','Hot Only']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${filter === val ? 'bg-[#1e2d7d] border-[#1e2d7d] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Court */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          {loading
            ? <div className="text-gray-400 text-sm animate-pulse">Loading shot data...</div>
            : <CourtChart zones={zones} filter={filter}/>
          }
        </div>

      </div>
    </div>
  )
}
