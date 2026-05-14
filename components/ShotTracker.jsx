'use client'

import { useState, useEffect, useCallback } from 'react'
import CourtChart from './CourtChart'
import BettingInsights from './BettingInsights'

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

const DEFAULT_PLAYER = { id: '1628932', name: "A'ja Wilson", team: 'LVA', abbr: 'LVA' }
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
  const [drawerOpen, setDrawerOpen]   = useState(false)

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
    setPlayer(p); setQuery(''); setShowDrop(false); setLoading(true); setDrawerOpen(false)
    try {
      const d = await fetch(`/api/player/${p.id}`).then(r => r.json())
      if (d.zones?.length) setZones(d.zones)
      setStats(d.stats || null)
    } catch {}
    setLoading(false)
  }, [])

  const statCards = [
    { val: stats?.PTS    ?? '—', lbl: 'PPG',  color: '#FF6900' },
    { val: stats?.FG_PCT  != null ? (stats.FG_PCT  * 100).toFixed(1) : '—', lbl: 'FG%',  color: '#16a34a' },
    { val: stats?.FG3_PCT != null ? (stats.FG3_PCT * 100).toFixed(1) : '—', lbl: '3P%',  color: '#7c3aed' },
    { val: stats?.AST    ?? '—',  lbl: 'AST',  color: '#2563eb' },
  ]

  const sortedZones = [...zones].sort((a, b) => b.fgPct - a.fgPct)

  const Sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dashboard</span>
        {lastUpdated && (
          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            ● LIVE
          </span>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input
            className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF6900]/60 focus:bg-white transition-all"
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
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[10px] font-bold text-[#FF6900] flex-shrink-0">
                    {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                    <div className="text-[11px] text-gray-400">{p.team}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current player */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6900] to-[#c0392b] flex items-center justify-center text-[11px] font-bold text-white">
            {player.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="text-gray-900 font-bold text-sm">{player.name}</div>
            <div className="text-gray-400 text-[11px]">{player.team} · 2026</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Season Stats</div>
        <div className="grid grid-cols-2 gap-2">
          {statCards.map(({ val, lbl, color }) => (
            <div key={lbl} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone leaderboard */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Best Zones</div>
        <div className="space-y-1">
          {sortedZones.slice(0, 5).map((z, i) => (
            <div key={z.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-[10px] text-gray-300 w-3 font-bold">{i+1}</span>
              <span className="flex-1 text-[12px] font-semibold text-gray-700">{z.label}</span>
              <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
              </div>
              <span className="text-[12px] font-bold w-8 text-right" style={{ color: z.color }}>
                {Math.round(z.fgPct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <BettingInsights stats={stats} zones={zones}/>

      {/* All zones list */}
      <div className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">All Zones</div>
        <div className="space-y-2">
          {ZONE_ORDER.map(id => {
            const z = zones.find(x => x.id === id)
            if (!z) return null
            const above = z.fgPct >= 0.45
            const below = z.fgPct < 0.35
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: z.color }}/>
                <span className="flex-1 text-[11px] text-gray-600">{z.label}</span>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                </div>
                <span className="text-[11px] font-bold w-7 text-right" style={{ color: z.color }}>
                  {Math.round(z.fgPct * 100)}%
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-7 text-center
                  ${above ? 'bg-red-50 text-red-600' : below ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {above ? `+${Math.round((z.fgPct - 0.37)*100)}` : below ? `−${Math.round((0.37 - z.fgPct)*100)}` : 'AVG'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-54px)] bg-white overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:block w-[300px] flex-shrink-0">
        {Sidebar}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-40"/>
          <div className="md:hidden fixed left-0 top-0 h-full w-[85%] max-w-[320px] z-50 shadow-2xl">
            {Sidebar}
          </div>
        </>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 flex-shrink-0 flex items-center gap-2 md:gap-3">
          <button onClick={() => setDrawerOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-sm text-gray-600 truncate">
              <span className="hidden sm:inline">Shot zones · </span>
              <strong className="text-gray-900">{player.name}</strong>
              <span className="hidden sm:inline text-gray-400"> · 2026 WNBA</span>
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 flex-shrink-0">
            <span>Cold</span>
            {['#3a86ff','#4cc9f0','#f8b500','#f77f00','#c0392b'].map(c => (
              <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }}/>
            ))}
            <span>Hot</span>
          </div>
        </div>

        {/* Mobile stats bar (above court) */}
        <div className="md:hidden flex gap-2 px-3 py-3 overflow-x-auto bg-white border-b border-gray-100 flex-shrink-0">
          {statCards.map(({ val, lbl, color }) => (
            <div key={lbl} className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center min-w-[72px]">
              <div className="text-lg font-extrabold" style={{ color }}>{val}</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex justify-center gap-1.5 py-3 px-3 flex-shrink-0 overflow-x-auto">
          {FILTERS.map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3.5 md:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0
                ${filter === val
                  ? 'bg-[#FF6900] border-[#FF6900] text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Court */}
        <div className="flex-1 flex items-center justify-center p-3 md:p-4 min-h-0">
          {loading
            ? <div className="text-gray-400 text-sm animate-pulse">Loading shot data…</div>
            : <CourtChart zones={zones} filter={filter}/>
          }
        </div>

      </div>
    </div>
  )
}
