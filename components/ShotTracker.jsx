'use client'

import { useState, useEffect, useCallback } from 'react'
import CourtChart from './CourtChart'
import BettingInsights from './BettingInsights'
import DonutChart from './DonutChart'

const ORANGE = '#F57B20'

const FALLBACK_ZONES = [
  { id: 'paint',    label: 'Paint',       fga: 4.2, fgPct: 0.68, color: '#F57B20', radius: 13, center: { x: 250, y: 370 } },
  { id: 'top_key',  label: 'Top of Key',  fga: 3.1, fgPct: 0.44, color: '#e05a00', radius: 10, center: { x: 250, y: 195 } },
  { id: 'corner_l', label: 'Corner 3 L',  fga: 1.2, fgPct: 0.43, color: '#e05a00', radius: 7,  center: { x: 42,  y: 418 } },
  { id: 'corner_r', label: 'Corner 3 R',  fga: 1.0, fgPct: 0.42, color: '#cc7a00', radius: 6,  center: { x: 458, y: 418 } },
]

const DEFAULT_PLAYER = { id: '1628932', name: "A'ja Wilson", team: 'LVA', abbr: 'LVA' }
const ZONE_ORDER = ['paint','top_key','corner_l','corner_r','wing_l','wing_r','mid_l','mid_r']
const FILTERS = [['all','All Zones'],['3pt','3-Pointers'],['paint','Paint'],['hot','🔥 Hot']]

function PlayerSearch({ allPlayers, team, onTeamChange, query, setQuery, onSelect, teams, placeholder }) {
  const [show, setShow] = useState(false)
  const filtered = allPlayers
    .filter(p => team === 'all' || p.team === team)
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  return (
    <div className="space-y-2">
      {onTeamChange && (
        <select value={team} onChange={e => onTeamChange(e.target.value)}
          className="w-full h-8 rounded-lg px-2 text-xs font-semibold outline-none"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
          <option value="all">All teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#bbb' }}>⌕</span>
        <input
          className="w-full h-9 rounded-lg pl-8 pr-3 text-sm outline-none transition-all"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0f0f0' }}
          placeholder={placeholder || 'Search player...'}
          value={query}
          onChange={e => { setQuery(e.target.value); setShow(true) }}
          onFocus={e => { setShow(true); e.target.style.borderColor = ORANGE }}
          onBlur={e => { setTimeout(() => setShow(false), 150); e.target.style.borderColor = '#2a2a2a' }}
        />
        {show && filtered.length > 0 && (
          <div className="absolute top-10 left-0 right-0 rounded-xl overflow-hidden z-50"
            style={{ background: '#161616', border: '1px solid #2a2a2a', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            {filtered.map(p => (
              <div key={p.id} onMouseDown={() => { onSelect(p); setShow(false) }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid #1e1e1e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: '#1e1e1e', border: `1px solid ${ORANGE}30`, color: ORANGE }}>
                  {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#f0f0f0' }}>{p.name}</div>
                  <div className="text-[11px]" style={{ color: '#777' }}>{p.team}</div>
                </div>
                <span className="ml-auto text-xs" style={{ color: '#aaa' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ val, label, color = ORANGE }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: '#161616', border: '1px solid #1e1e1e', borderTop: `2px solid ${color}` }}>
      <div className="text-xl font-black leading-none" style={{ color }}>{val}</div>
      <div className="text-[9px] font-bold tracking-widest uppercase mt-1" style={{ color: '#bbb' }}>{label}</div>
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
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#111', borderRight: '1px solid #1e1e1e' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#aaa' }}>Player</span>
          {lastUpdated && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: ORANGE, background: `${ORANGE}15`, border: `1px solid ${ORANGE}30` }}>● Live</span>}
        </div>
        <PlayerSearch
          allPlayers={allPlayers} teams={teams}
          team={team} onTeamChange={setTeam}
          query={query} setQuery={setQuery}
          onSelect={loadPlayer}
        />
      </div>

      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ background: `${ORANGE}15`, border: `1px solid ${ORANGE}40`, color: ORANGE }}>
            {player.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="font-black text-sm leading-tight" style={{ color: '#f0f0f0' }}>{player.name}</div>
            <div className="text-[11px] font-semibold mt-0.5" style={{ color: '#bbb' }}>{player.team} · 2026</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="text-[9px] font-black tracking-widest uppercase mb-3" style={{ color: '#aaa' }}>Season Stats</div>
        <div className="grid grid-cols-4 gap-1.5">
          <StatCard val={stats?.PTS ?? '—'} label="PPG" color={ORANGE}/>
          <StatCard val={stats?.FG_PCT != null ? (stats.FG_PCT*100).toFixed(0)+'%' : '—'} label="FG%" color="#22c55e"/>
          <StatCard val={stats?.FG3_PCT != null ? (stats.FG3_PCT*100).toFixed(0)+'%' : '—'} label="3P%" color="#a855f7"/>
          <StatCard val={stats?.AST ?? '—'} label="AST" color="#3b82f6"/>
        </div>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="text-[9px] font-black tracking-widest uppercase mb-3" style={{ color: '#aaa' }}>Best Zones</div>
        <div className="space-y-1">
          {sortedZones.slice(0, 5).map((z, i) => (
            <div key={z.id} className="flex items-center gap-2.5 py-1.5">
              <span className="text-[9px] font-black w-3 text-right" style={{ color: '#555' }}>0{i+1}</span>
              <span className="flex-1 text-xs font-semibold" style={{ color: '#aaa' }}>{z.label}</span>
              <div className="w-10 h-0.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
              </div>
              <span className="text-xs font-black w-8 text-right" style={{ color: z.color }}>
                {Math.round(z.fgPct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <DonutChart stats={stats} zones={zones}/>
      <BettingInsights stats={stats} zones={zones}/>

      <div className="px-5 py-4">
        <div className="text-[9px] font-black tracking-widest uppercase mb-3" style={{ color: '#aaa' }}>All Zones</div>
        <div className="space-y-2">
          {ZONE_ORDER.map(id => {
            const z = zones.find(x => x.id === id)
            if (!z) return null
            const above = z.fgPct >= 0.45, below = z.fgPct < 0.35
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: z.color }}/>
                <span className="flex-1 text-[11px]" style={{ color: '#999' }}>{z.label}</span>
                <div className="w-10 h-0.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                  <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }}/>
                </div>
                <span className="text-[11px] font-black w-7 text-right" style={{ color: z.color }}>
                  {Math.round(z.fgPct * 100)}%
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded w-7 text-center"
                  style={{
                    background: above ? '#22c55e15' : below ? '#ef444415' : '#1e1e1e',
                    color: above ? '#22c55e' : below ? '#ef4444' : '#333'
                  }}>
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
    <div className="flex flex-1 overflow-hidden min-h-0" style={{ background: '#0d0d0d' }}>

      <div className="hidden md:block w-[290px] flex-shrink-0">{Sidebar}</div>

      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }}/>
      )}
      <div className="md:hidden fixed left-0 top-0 h-full w-[85%] max-w-[320px] z-50 shadow-2xl"
        style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
        {Sidebar}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 flex-shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid #1e1e1e', background: '#111' }}>
          <button onClick={() => setDrawerOpen(true)}
            className="md:hidden w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black tracking-tight leading-tight" style={{ color: '#f0f0f0' }}>
              {player.name}
              {compareOn && playerB && <span style={{ color: '#555' }}> vs </span>}
              {compareOn && playerB && <span>{playerB.name}</span>}
            </p>
          </div>

          <div className="flex items-center rounded-lg p-0.5 flex-shrink-0" style={{ background: '#161616', border: '1px solid #1e1e1e' }}>
            {[['zones','Zones'],['shots','Shots']].map(([v, lbl]) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 h-9 rounded-md text-[11px] font-black transition-all"
                style={view === v ? { background: ORANGE, color: '#fff' } : { color: '#444' }}>
                {lbl}
              </button>
            ))}
          </div>

          <button onClick={() => { setCompareOn(o => !o); if (compareOn) { setPlayerB(null); setZonesB([]); setStatsB(null) } }}
            className="h-11 rounded-lg font-black transition-all flex-shrink-0 px-2 md:px-3"
            style={compareOn
              ? { background: ORANGE, color: '#fff' }
              : { background: '#161616', border: '1px solid #2a2a2a', color: '#555' }}>
            <span className="md:hidden text-base">{compareOn ? '×' : '⇄'}</span>
            <span className="hidden md:inline text-xs">{compareOn ? '× Exit' : '⇄ Compare'}</span>
          </button>
        </div>

        {compareOn && !playerB && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e1e1e', background: '#111' }}>
            <PlayerSearch
              allPlayers={allPlayers} teams={teams}
              team={teamB} onTeamChange={setTeamB}
              query={queryB} setQuery={setQueryB}
              onSelect={loadPlayerB}
              placeholder="Search second player..."
            />
          </div>
        )}

        <div className="flex justify-center gap-2 py-3 px-4 flex-shrink-0 overflow-x-auto" style={{ background: '#0d0d0d' }}>
          {FILTERS.map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 min-h-[44px] rounded-full text-xs font-black transition-all flex-shrink-0 tracking-wide"
              style={filter === val
                ? { background: ORANGE, color: '#fff', border: `1px solid ${ORANGE}` }
                : { background: 'transparent', border: '1px solid #2a2a2a', color: '#555' }}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden p-2 md:p-8 min-h-0" style={{ background: '#0d0d0d' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm animate-pulse" style={{ color: '#555' }}>Loading…</div>
          ) : compareOn && playerB ? (
            <div className="flex flex-row gap-2 md:gap-6 h-full w-full">
              {[
                { p: player, z: zones, s: stats, sh: shots, color: ORANGE },
                { p: playerB, z: zonesB, s: statsB, sh: shotsB, color: '#3b82f6' },
              ].map(({ p, z, s, sh, color }, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-0 overflow-hidden">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}>
                          {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] md:text-sm font-black truncate" style={{ color: '#f0f0f0' }}>{p.name}</div>
                          <div className="text-[9px] md:text-[10px]" style={{ color: '#777' }}>{p.team}</div>
                        </div>
                      </div>
                      {idx === 1 && (
                        <button onClick={() => { setPlayerB(null); setZonesB([]); setStatsB(null) }}
                          className="text-[10px] flex-shrink-0 ml-1" style={{ color: '#555' }}>✕</button>
                      )}
                    </div>
                    <div className="hidden md:block mb-2 space-y-1.5">
                      {[
                        { label: 'PPG', val: s?.PTS?.toFixed(1) ?? '—', max: 35 },
                        { label: 'FG%', val: s?.FG_PCT != null ? (s.FG_PCT*100).toFixed(0)+'%' : '—', max: 100, raw: (s?.FG_PCT||0)*100 },
                        { label: '3P%', val: s?.FG3_PCT != null ? (s.FG3_PCT*100).toFixed(0)+'%' : '—', max: 60, raw: (s?.FG3_PCT||0)*100 },
                        { label: 'AST', val: s?.AST?.toFixed(1) ?? '—', max: 12 },
                      ].map(({ label, val, max, raw }) => {
                        const pct = Math.min(100, ((raw ?? parseFloat(val)) / max) * 100) || 0
                        return (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[9px] font-black w-6 text-right" style={{ color: '#555' }}>{label}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}/>
                            </div>
                            <span className="text-[10px] font-black w-8" style={{ color }}>{val}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex md:hidden gap-1 mb-1.5">
                      {[
                        { v: s?.PTS ?? '—', l: 'PPG' },
                        { v: s?.FG_PCT != null ? (s.FG_PCT*100).toFixed(0)+'%' : '—', l: 'FG%' },
                      ].map(({ v, l }) => (
                        <div key={l} className="flex-1 rounded-lg p-1.5 text-center" style={{ background: '#161616', border: `1px solid #1e1e1e`, borderTop: `2px solid ${color}` }}>
                          <div className="text-sm font-black leading-none" style={{ color }}>{v}</div>
                          <div className="text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#bbb' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full flex-1 flex items-center">
                    <CourtChart zones={z} shots={sh} filter={filter} view={view} compact/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              <div className="flex items-start justify-center pt-2 md:pt-0 md:flex-1 md:items-center">
                <CourtChart zones={zones} shots={shots} filter={filter} view={view}/>
              </div>
              {stats && (
                <div className="md:hidden flex gap-2 px-2 pb-3 pt-2 flex-shrink-0">
                  {[
                    { v: stats.PTS?.toFixed(1) ?? '—', l: 'PPG', c: ORANGE },
                    { v: stats.FG_PCT != null ? (stats.FG_PCT*100).toFixed(0)+'%' : '—', l: 'FG%', c: '#22c55e' },
                    { v: stats.FG3_PCT != null ? (stats.FG3_PCT*100).toFixed(0)+'%' : '—', l: '3P%', c: '#a855f7' },
                    { v: stats.AST?.toFixed(1) ?? '—', l: 'AST', c: '#3b82f6' },
                    { v: stats.REB?.toFixed(1) ?? '—', l: 'REB', c: '#f59e0b' },
                  ].map(({ v, l, c }) => (
                    <div key={l} className="flex-1 rounded-xl p-2 text-center" style={{ background: '#161616', border: '1px solid #1e1e1e', borderTop: `2px solid ${c}` }}>
                      <div className="text-sm font-black leading-none" style={{ color: c }}>{v}</div>
                      <div className="text-[8px] font-bold tracking-widest uppercase mt-1" style={{ color: '#bbb' }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
