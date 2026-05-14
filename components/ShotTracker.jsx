'use client'

import { useState, useEffect, useCallback } from 'react'
import CourtChart from './CourtChart'

const FALLBACK_ZONES = [
  { id: 'paint',    label: 'Paint',       fga: 4.2, fgPct: 0.68, color: '#c0392b', radius: 13, center: { x: 250, y: 370 } },
  { id: 'top_key',  label: 'Top of Key',  fga: 3.1, fgPct: 0.44, color: '#f77f00', radius: 10, center: { x: 250, y: 195 } },
  { id: 'corner_l', label: 'Corner 3 L',  fga: 1.2, fgPct: 0.43, color: '#f77f00', radius: 7,  center: { x: 42,  y: 418 } },
  { id: 'corner_r', label: 'Corner 3 R',  fga: 1.0, fgPct: 0.42, color: '#f8b500', radius: 6,  center: { x: 458, y: 418 } },
  { id: 'wing_l',   label: 'Wing 3 L',    fga: 1.9, fgPct: 0.40, color: '#f8b500', radius: 8,  center: { x: 95,  y: 290 } },
  { id: 'wing_r',   label: 'Wing 3 R',    fga: 1.8, fgPct: 0.38, color: '#f8b500', radius: 8,  center: { x: 405, y: 290 } },
  { id: 'mid_l',    label: 'Mid-Range L', fga: 0.8, fgPct: 0.33, color: '#4cc9f0', radius: 5,  center: { x: 165, y: 275 } },
  { id: 'mid_r',    label: 'Mid-Range R', fga: 0.7, fgPct: 0.31, color: '#4cc9f0', radius: 5,  center: { x: 335, y: 275 } },
]

const DEFAULT_PLAYER = { id: '1630710', name: 'Caitlin Clark', team: 'Indiana Fever', abbr: 'IND' }
const ZONE_ORDER = ['paint','top_key','corner_l','corner_r','wing_l','wing_r','mid_l','mid_r']

const FILTERS = [['all','All Zones'],['3pt','3-Pointers'],['paint','Paint'],['hot','🔥 Hot']]

export default function ShotTracker() {
  const [player, setPlayer]     = useState(DEFAULT_PLAYER)
  const [zones, setZones]       = useState(FALLBACK_ZONES)
  const [stats, setStats]       = useState(null)
  const [filter, setFilter]     = useState('all')
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [allPlayers, setAllPlayers]   = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setAllPlayers).catch(() => {})
    fetch('/api/player/' + DEFAULT_PLAYER.id)
      .then(r => r.json())
      .then(d => { if (d.zones?.length) setZones(d.zones); if (d.stats) setStats(d.stats) })
      .catch(() => {})
    fetch('/api/meta').then(r => r.json()).then(d => setLastUpdated(d.lastUpdated)).catch(() => {})
  }, [])

  const filteredPlayers = allPlayers
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  const loadPlayer = useCallback(async (p) => {
    setPlayer(p); setQuery(''); setShowDrop(false); setLoading(true)
    try {
      const d = await fetch(`/api/player/${p.id}`).then(r => r.json())
      if (d.zones?.length) setZones(d.zones)
      if (d.stats) setStats(d.stats)
    } catch {}
    setLoading(false)
  }, [])

  const statCards = [
    { val: stats?.PTS    ?? '22.4', lbl: 'PPG',  color: '#FF6900' },
    { val: stats?.FG_PCT  ? (stats.FG_PCT  * 100).toFixed(1) : '46.3', lbl: 'FG%',  color: '#34d399' },
    { val: stats?.FG3_PCT ? (stats.FG3_PCT * 100).toFixed(1) : '41.2', lbl: '3P%',  color: '#a78bfa' },
    { val: stats?.AST    ?? '8.1',  lbl: 'AST',  color: '#60a5fa' },
  ]

  const sortedZones = [...zones].sort((a, b) => b.fgPct - a.fgPct)

  return (
    <div className="flex h-[calc(100vh-54px)] bg-[#080d1a] overflow-hidden">

      {/* SIDEBAR */}
      <div className={`
        flex-shrink-0 bg-[#0d1325] border-r border-white/5 flex flex-col overflow-y-auto
        transition-all duration-300
        ${sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}
      `}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between min-w-[280px]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Dashboard</span>
          {lastUpdated && (
            <span className="text-[9px] font-semibold text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              ● LIVE
            </span>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 min-w-[280px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
            <input
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FF6900]/50 focus:bg-white/8 transition-all"
              placeholder="Search player..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            />
            {showDrop && filteredPlayers.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-[#0d1325] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {filteredPlayers.map(p => (
                  <div key={p.id} onMouseDown={() => loadPlayer(p)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#FF6900]/20 flex items-center justify-center text-[10px] font-bold text-[#FF6900] flex-shrink-0">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-white/35">{p.team}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current player */}
        <div className="px-4 py-3 border-b border-white/5 min-w-[280px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6900] to-[#c0392b] flex items-center justify-center text-[11px] font-bold text-white">
              {player.name.split(' ').map(n => n[0]).join('').slice(0,2)}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{player.name}</div>
              <div className="text-white/40 text-[11px]">{player.team} · 2026</div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="p-4 border-b border-white/5 min-w-[280px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Season Overview</div>
          <div className="grid grid-cols-2 gap-2">
            {statCards.map(({ val, lbl, color }) => (
              <div key={lbl} className="bg-white/3 border border-white/5 rounded-xl p-3 text-center hover:border-white/10 transition-colors">
                <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
                <div className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wide font-semibold">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone leaderboard */}
        <div className="p-4 border-b border-white/5 min-w-[280px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Best Zones</div>
          <div className="space-y-1">
            {sortedZones.slice(0, 5).map((z, i) => (
              <div key={z.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/3 cursor-pointer transition-colors">
                <span className="text-[10px] text-white/20 w-3 font-bold">{i+1}</span>
                <span className="flex-1 text-[12px] font-semibold text-white/70">{z.label}</span>
                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                </div>
                <span className="text-[12px] font-bold w-8 text-right" style={{ color: z.color }}>
                  {Math.round(z.fgPct * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone efficiency list */}
        <div className="p-4 min-w-[280px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">All Zones</div>
          <div className="space-y-2">
            {ZONE_ORDER.map(id => {
              const z = zones.find(x => x.id === id)
              if (!z) return null
              const above = z.fgPct >= 0.45
              const below = z.fgPct < 0.35
              return (
                <div key={id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: z.color }}/>
                  <span className="flex-1 text-[11px] text-white/50">{z.label}</span>
                  <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                  </div>
                  <span className="text-[11px] font-bold w-7 text-right" style={{ color: z.color }}>
                    {Math.round(z.fgPct * 100)}%
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-7 text-center
                    ${above ? 'bg-red-500/15 text-red-400' : below ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-white/25'}`}>
                    {above ? `+${Math.round((z.fgPct - 0.37)*100)}` : below ? `−${Math.round((0.37 - z.fgPct)*100)}` : 'AVG'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="bg-[#0d1325]/80 backdrop-blur border-b border-white/5 px-4 py-3 flex-shrink-0 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm transition-all flex-shrink-0">
            {sidebarOpen ? '‹' : '›'}
          </button>

          <div className="flex-1 text-center">
            <span className="text-white/50 text-sm">Shot zones · </span>
            <span className="text-white font-bold text-sm">{player.name}</span>
            <span className="text-white/30 text-sm"> · 2026 WNBA</span>
          </div>

          {/* Legend */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/3 border border-white/8 rounded-full px-3 py-1 text-xs text-white/30 flex-shrink-0">
            <span>Cold</span>
            {['#3a86ff','#4cc9f0','#f8b500','#f77f00','#c0392b'].map(c => (
              <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }}/>
            ))}
            <span>Hot</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex justify-center gap-2 py-3 px-4 flex-shrink-0 bg-[#080d1a]">
          {FILTERS.map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${filter === val
                  ? 'bg-[#FF6900] border-[#FF6900] text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/3 border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Court */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-[#080d1a]">
          {loading
            ? <div className="text-white/30 text-sm animate-pulse">Loading shot data…</div>
            : <CourtChart zones={zones} filter={filter}/>
          }
        </div>

      </div>
    </div>
  )
}
