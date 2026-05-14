'use client'

import { useState, useEffect, useCallback } from 'react'
import CourtChart from './CourtChart'
import BettingInsights from './BettingInsights'

const FALLBACK_ZONES = [
  { id: 'paint',    label: 'Paint',       fga: 4.2, fgPct: 0.68, color: '#c0392b', radius: 13, center: { x: 250, y: 370 } },
  { id: 'top_key',  label: 'Top of Key',  fga: 3.1, fgPct: 0.44, color: '#f77f00', radius: 10, center: { x: 250, y: 195 } },
  { id: 'corner_l', label: 'Corner 3 L',  fga: 1.2, fgPct: 0.43, color: '#f77f00', radius: 7,  center: { x: 42,  y: 418 } },
  { id: 'corner_r', label: 'Corner 3 R',  fga: 1.0, fgPct: 0.42, color: '#f8b500', radius: 6,  center: { x: 458, y: 418 } },
]

const DEFAULT_PLAYER = { id: '1628932', name: "A'ja Wilson", team: 'LVA', abbr: 'LVA' }
const ZONE_ORDER = ['paint','top_key','corner_l','corner_r','wing_l','wing_r','mid_l','mid_r']
const FILTERS = [['all','All Zones'],['3pt','3-Pointers'],['paint','Paint'],['hot','🔥 Hot']]

function PlayerSearch({ allPlayers, team, onTeamChange, query, setQuery, onSelect, teams, label, placeholder }) {
  const [show, setShow] = useState(false)
  const filtered = allPlayers
    .filter(p => team === 'all' || p.team === team)
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  return (
    <div className="space-y-2">
      {label && <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>}
      {onTeamChange && (
        <select value={team} onChange={e => onTeamChange(e.target.value)}
          className="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg px-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#FF6900]/60">
          <option value="all">All teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
        <input
          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF6900]/60 focus:bg-white"
          placeholder={placeholder || 'Search player...'}
          value={query}
          onChange={e => { setQuery(e.target.value); setShow(true) }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
        />
        {show && filtered.length > 0 && (
          <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {filtered.map(p => (
              <div key={p.id} onMouseDown={() => { onSelect(p); setShow(false) }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
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
  )
}

function PlayerCard({ player, stats, color = '#FF6900' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, #c0392b)` }}>
        {player.name.split(' ').map(n => n[0]).join('').slice(0,2)}
      </div>
      <div className="min-w-0">
        <div className="text-gray-900 font-bold text-sm truncate">{player.name}</div>
        <div className="text-gray-400 text-[11px]">{player.team} · 2026</div>
      </div>
    </div>
  )
}

function MiniStats({ stats }) {
  const cards = [
    { val: stats?.PTS ?? '—', lbl: 'PPG', c: '#FF6900' },
    { val: stats?.FG_PCT  != null ? (stats.FG_PCT  * 100).toFixed(1) : '—', lbl: 'FG%', c: '#16a34a' },
    { val: stats?.FG3_PCT != null ? (stats.FG3_PCT * 100).toFixed(1) : '—', lbl: '3P%', c: '#7c3aed' },
    { val: stats?.AST ?? '—', lbl: 'AST', c: '#2563eb' },
  ]
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cards.map(({ val, lbl, c }) => (
        <div key={lbl} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-center">
          <div className="text-base font-extrabold leading-none" style={{ color: c }}>{val}</div>
          <div className="text-[9px] text-gray-400 mt-0.5 uppercase font-semibold">{lbl}</div>
        </div>
      ))}
    </div>
  )
}

export default function ShotTracker() {
  const [player, setPlayer]   = useState(DEFAULT_PLAYER)
  const [zones, setZones]     = useState(FALLBACK_ZONES)
  const [stats, setStats]     = useState(null)
  const [filter, setFilter]   = useState('all')
  const [view, setView]       = useState('zones')
  const [shots, setShots]     = useState([])
  const [shotsB, setShotsB]   = useState([])
  const [query, setQuery]     = useState('')
  const [team, setTeam]       = useState('all')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [allPlayers, setAllPlayers]   = useState([])
  const [drawerOpen, setDrawerOpen]   = useState(false)

  // Compare mode
  const [compareOn, setCompareOn] = useState(false)
  const [playerB, setPlayerB]     = useState(null)
  const [zonesB, setZonesB]       = useState([])
  const [statsB, setStatsB]       = useState(null)
  const [queryB, setQueryB]       = useState('')
  const [teamB, setTeamB]         = useState('all')

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setAllPlayers).catch(() => {})
    fetch('/api/player/' + DEFAULT_PLAYER.id)
      .then(r => r.json())
      .then(d => { if (d.zones?.length) setZones(d.zones); if (d.stats) setStats(d.stats); setShots(d.shots || []) })
      .catch(() => {})
    fetch('/api/meta').then(r => r.json()).then(d => setLastUpdated(d.lastUpdated)).catch(() => {})
  }, [])

  const teams = [...new Set(allPlayers.map(p => p.team))].filter(Boolean).sort()

  const loadPlayer = useCallback(async (p) => {
    setPlayer(p); setQuery(''); setLoading(true); setDrawerOpen(false)
    try {
      const d = await fetch(`/api/player/${p.id}`).then(r => r.json())
      if (d.zones?.length) setZones(d.zones)
      setStats(d.stats || null)
      setShots(d.shots || [])
    } catch {}
    setLoading(false)
  }, [])

  const loadPlayerB = useCallback(async (p) => {
    setPlayerB(p); setQueryB('')
    try {
      const d = await fetch(`/api/player/${p.id}`).then(r => r.json())
      setZonesB(d.zones || [])
      setStatsB(d.stats || null)
      setShotsB(d.shots || [])
    } catch {}
  }, [])

  const sortedZones = [...zones].sort((a, b) => b.fgPct - a.fgPct)

  const Sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dashboard</span>
        {lastUpdated && (
          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">● LIVE</span>
        )}
      </div>

      <div className="p-4 border-b border-gray-100">
        <PlayerSearch
          allPlayers={allPlayers} teams={teams}
          team={team} onTeamChange={setTeam}
          query={query} setQuery={setQuery}
          onSelect={loadPlayer}
          label="Player"
        />
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <PlayerCard player={player} stats={stats}/>
      </div>

      {/* Stat cards */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Season Stats</div>
        <MiniStats stats={stats}/>
      </div>

      {/* Best Zones */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Best Zones</div>
        <div className="space-y-1">
          {sortedZones.slice(0, 5).map((z, i) => (
            <div key={z.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
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

      {/* All Zones */}
      <div className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">All Zones</div>
        <div className="space-y-2">
          {ZONE_ORDER.map(id => {
            const z = zones.find(x => x.id === id)
            if (!z) return null
            const above = z.fgPct >= 0.45, below = z.fgPct < 0.35
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
      <div className="hidden md:block w-[300px] flex-shrink-0">{Sidebar}</div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} className="md:hidden fixed inset-0 bg-black/40 z-40"/>
          <div className="md:hidden fixed left-0 top-0 h-full w-[85%] max-w-[320px] z-50 shadow-2xl">{Sidebar}</div>
        </>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 flex-shrink-0 flex items-center gap-2">
          <button onClick={() => setDrawerOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-sm text-gray-600 truncate">
              <strong className="text-gray-900">{player.name}</strong>
              {compareOn && playerB && <span className="text-gray-400"> vs </span>}
              {compareOn && playerB && <strong className="text-gray-900">{playerB.name}</strong>}
            </p>
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
            {[['zones','Zones'],['shots','Shots']].map(([v, lbl]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 h-8 rounded-md text-[11px] font-bold transition-all
                  ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {lbl}
              </button>
            ))}
          </div>

          <button onClick={() => { setCompareOn(o => !o); if (compareOn) { setPlayerB(null); setZonesB([]); setStatsB(null) } }}
            className={`px-3 h-9 rounded-lg text-xs font-bold transition-all flex-shrink-0
              ${compareOn ? 'bg-[#FF6900] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            {compareOn ? '× Exit' : '⇄ Compare'}
          </button>
        </div>

        {/* Compare panel (when on, no player B yet) */}
        {compareOn && !playerB && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <PlayerSearch
              allPlayers={allPlayers} teams={teams}
              team={teamB} onTeamChange={setTeamB}
              query={queryB} setQuery={setQueryB}
              onSelect={loadPlayerB}
              placeholder="Search second player to compare..."
            />
          </div>
        )}

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

        {/* Court area */}
        <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading shot data…</div>
          ) : compareOn && playerB ? (
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
                <div className="w-full max-w-[400px]">
                  <PlayerCard player={player} stats={stats}/>
                  <div className="mt-2"><MiniStats stats={stats}/></div>
                </div>
                <CourtChart zones={zones} shots={shots} filter={filter} view={view}/>
              </div>
              <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
                <div className="w-full max-w-[400px] flex items-center justify-between">
                  <PlayerCard player={playerB} stats={statsB} color="#2563eb"/>
                  <button onClick={() => { setPlayerB(null); setZonesB([]); setStatsB(null) }}
                    className="text-[11px] text-gray-400 hover:text-gray-600">change</button>
                </div>
                <div className="w-full max-w-[400px]"><MiniStats stats={statsB}/></div>
                <CourtChart zones={zonesB} shots={shotsB} filter={filter} view={view}/>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <CourtChart zones={zones} shots={shots} filter={filter} view={view}/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
