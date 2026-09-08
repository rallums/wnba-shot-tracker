'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CourtChart from './CourtChart'
import CourtLegend from './CourtLegend'
import BettingInsights from './BettingInsights'
import DonutChart from './DonutChart'
import PlayerSearch from './PlayerSearch'
import ShareLink from './ShareLink'
import { ORANGE, FILTERS } from '@/lib/constants'
import { formatLastUpdated, playerInitials } from '@/lib/format'

const FALLBACK_ZONES = [
  { id: 'paint', label: 'Paint', fga: 4.2, fgPct: 0.68, color: '#F57B20', radius: 13, center: { x: 250, y: 370 } },
  { id: 'top_key', label: 'Top of Key', fga: 3.1, fgPct: 0.44, color: '#e05a00', radius: 10, center: { x: 250, y: 195 } },
  { id: 'corner_l', label: 'Corner 3 L', fga: 1.2, fgPct: 0.43, color: '#e05a00', radius: 7, center: { x: 60, y: 420 } },
  { id: 'corner_r', label: 'Corner 3 R', fga: 1.0, fgPct: 0.42, color: '#cc7a00', radius: 6, center: { x: 440, y: 420 } },
]

const DEFAULT_PLAYER = { id: '1628932', name: "A'ja Wilson", team: 'LVA', abbr: 'LVA' }
const ZONE_ORDER = ['paint', 'top_key', 'corner_l', 'corner_r', 'wing_l', 'wing_r', 'mid_l', 'mid_r']

function StatCard({ val, label, color = ORANGE }) {
  return (
    <div className="rounded-xl p-3 text-center bg-wnba-surface-elevated border border-wnba-border" style={{ borderTop: `2px solid ${color}` }}>
      <div className="text-xl font-black leading-none" style={{ color }}>{val}</div>
      <div className="text-[9px] font-bold tracking-widest uppercase mt-1 text-wnba-muted">{label}</div>
    </div>
  )
}

function DataFreshnessBadge({ lastUpdated }) {
  const label = formatLastUpdated(lastUpdated)
  if (!label) return null
  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-wnba-muted bg-wnba-input border border-wnba-border-strong"
      title="Season totals from a weekly data refresh — not live play-by-play"
    >
      Updated {label}
    </span>
  )
}

function PlayerLoadError({ message, onRetry }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-wnba-muted max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] px-4 rounded-lg text-xs font-black bg-wnba-orange text-white"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="w-48 h-48 rounded-full bg-wnba-surface-elevated border border-wnba-border" />
      <span className="text-sm text-wnba-dim">Loading player data…</span>
    </div>
  )
}

async function fetchPlayer(id) {
  const res = await fetch(`/api/player/${id}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Player not found')
    err.status = res.status
    throw err
  }
  return data
}

function ShotTrackerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const announceRef = useRef(null)
  const drawerRef = useRef(null)

  const [player, setPlayer] = useState(DEFAULT_PLAYER)
  const [zones, setZones] = useState(FALLBACK_ZONES)
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('zones')
  const [shots, setShots] = useState([])
  const [shotsB, setShotsB] = useState([])
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('all')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [allPlayers, setAllPlayers] = useState([])
  const [playersError, setPlayersError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [compareOn, setCompareOn] = useState(false)
  const [playerB, setPlayerB] = useState(null)
  const [zonesB, setZonesB] = useState([])
  const [statsB, setStatsB] = useState(null)
  const [queryB, setQueryB] = useState('')
  const [teamB, setTeamB] = useState('all')
  const [mobileCompareTab, setMobileCompareTab] = useState(0)

  const applyPlayerData = useCallback((d) => {
    if (d.zones?.length) setZones(d.zones)
    else setZones(FALLBACK_ZONES)
    setStats(d.stats || null)
    setShots(d.shots || [])
    setLoadError(null)
  }, [])

  const syncUrl = useCallback((p, compare) => {
    const params = new URLSearchParams()
    if (p?.id) params.set('player', p.id)
    if (compare?.id) params.set('compare', compare.id)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/', { scroll: false })
  }, [router])

  const loadPlayer = useCallback(async (p, { updateUrl = true } = {}) => {
    setPlayer(p)
    setQuery('')
    setLoading(true)
    setLoadError(null)
    setDrawerOpen(false)
    try {
      const d = await fetchPlayer(p.id)
      applyPlayerData(d)
      announceRef.current && (announceRef.current.textContent = `Loaded ${p.name}`)
      if (updateUrl) syncUrl(p, compareOn ? playerB : null)
    } catch (e) {
      setLoadError(
        e.status === 404
          ? `${p.name} data is not available yet. Check back after the next weekly update.`
          : 'Could not load player data. Check your connection and try again.'
      )
      setStats(null)
      setShots([])
    }
    setLoading(false)
  }, [applyPlayerData, syncUrl, compareOn, playerB])

  const loadPlayerB = useCallback(async (p) => {
    setPlayerB(p)
    setQueryB('')
    setCompareOn(true)
    try {
      const d = await fetchPlayer(p.id)
      setZonesB(d.zones || [])
      setStatsB(d.stats || null)
      setShotsB(d.shots || [])
      syncUrl(player, p)
    } catch {
      setZonesB([])
      setStatsB(null)
      setShotsB([])
    }
  }, [syncUrl, player])

  useEffect(() => {
    fetch('/api/players')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setAllPlayers)
      .catch(() => setPlayersError(true))
    fetch('/api/meta')
      .then(r => r.json())
      .then(d => setLastUpdated(d.lastUpdated))
      .catch(() => {})
  }, [])

  const urlHydrated = useRef(false)

  useEffect(() => {
    if (urlHydrated.current) return
    urlHydrated.current = true

    const playerId = searchParams.get('player')
    const compareId = searchParams.get('compare')
    const p = playerId
      ? { id: playerId, name: 'Loading…', team: '—' }
      : DEFAULT_PLAYER

    ;(async () => {
      await loadPlayer(p, { updateUrl: false })
      if (compareId) {
        setCompareOn(true)
        await loadPlayerB({ id: compareId, name: 'Loading…', team: '—' })
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!allPlayers.length) return
    const found = allPlayers.find(x => x.id === player.id)
    if (found && player.name === 'Loading…') setPlayer(found)
    if (playerB) {
      const foundB = allPlayers.find(x => x.id === playerB.id)
      if (foundB && playerB.name === 'Loading…') setPlayerB(foundB)
    }
  }, [allPlayers, player.id, player.name, playerB])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    setTimeout(() => drawerRef.current?.querySelector('input[type="search"]')?.focus(), 50)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const teams = [...new Set(allPlayers.map(p => p.team))].filter(Boolean).sort()
  const sortedZones = [...zones].sort((a, b) => b.fgPct - a.fgPct)
  const updatedLabel = formatLastUpdated(lastUpdated)

  const Sidebar = (
    <div className="flex flex-col h-full bg-wnba-surface border-r border-wnba-border">
      <div className="flex-shrink-0 px-5 py-4 border-b border-wnba-border relative z-[60]">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-[9px] font-black tracking-widest uppercase text-wnba-muted">Player</span>
        </div>
        {playersError && (
          <p className="text-[10px] text-amber-500 mb-2">Player list unavailable — search may be limited.</p>
        )}
        <PlayerSearch
          allPlayers={allPlayers}
          teams={teams}
          team={team}
          onTeamChange={setTeam}
          query={query}
          setQuery={setQuery}
          onSelect={loadPlayer}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="px-5 py-4 border-b border-wnba-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 bg-wnba-orange/10 border border-wnba-orange/40 text-wnba-orange">
            {playerInitials(player.name)}
          </div>
          <div>
            <div className="font-black text-sm leading-tight text-wnba-text">{player.name}</div>
            <div className="text-[11px] font-semibold mt-0.5 text-wnba-muted">{player.team} · 2026</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-wnba-border">
        <div className="text-[9px] font-black tracking-widest uppercase mb-3 text-wnba-muted">Season Stats</div>
        <div className="grid grid-cols-4 gap-1.5">
          <StatCard val={stats?.PTS ?? '—'} label="PPG" color={ORANGE} />
          <StatCard val={stats?.FG_PCT != null ? (stats.FG_PCT * 100).toFixed(0) + '%' : '—'} label="FG%" color="#22c55e" />
          <StatCard val={stats?.FG3_PCT != null ? (stats.FG3_PCT * 100).toFixed(0) + '%' : '—'} label="3P%" color="#a855f7" />
          <StatCard val={stats?.AST ?? '—'} label="AST" color="#3b82f6" />
        </div>
      </div>

      <div className="px-5 py-4 border-b border-wnba-border">
        <div className="text-[9px] font-black tracking-widest uppercase mb-3 text-wnba-muted">Best Zones</div>
        <div className="space-y-1">
          {sortedZones.slice(0, 5).map((z, i) => (
            <div key={z.id} className="flex items-center gap-2.5 py-1.5">
              <span className="text-[9px] font-black w-3 text-right text-wnba-dim">0{i + 1}</span>
              <span className="flex-1 text-xs font-semibold text-wnba-muted">{z.label}</span>
              <div className="w-10 h-0.5 rounded-full overflow-hidden bg-wnba-border">
                <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }} />
              </div>
              <span className="text-xs font-black w-8 text-right" style={{ color: z.color }}>
                {Math.round(z.fgPct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <DonutChart stats={stats} zones={zones} />
      <BettingInsights stats={stats} zones={zones} />

      <div className="px-5 py-4">
        <div className="text-[9px] font-black tracking-widest uppercase mb-3 text-wnba-muted">All Zones</div>
        <div className="space-y-2">
          {ZONE_ORDER.map(id => {
            const z = zones.find(x => x.id === id)
            if (!z) return null
            const above = z.fgPct >= 0.45
            const below = z.fgPct < 0.35
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: z.color }} />
                <span className="flex-1 text-[11px] text-wnba-muted">{z.label}</span>
                <div className="w-10 h-0.5 rounded-full overflow-hidden bg-wnba-border">
                  <div className="h-full rounded-full" style={{ width: `${z.fgPct * 100}%`, background: z.color }} />
                </div>
                <span className="text-[11px] font-black w-7 text-right" style={{ color: z.color }}>
                  {Math.round(z.fgPct * 100)}%
                </span>
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded w-7 text-center"
                  style={{
                    background: above ? '#22c55e15' : below ? '#ef444415' : '#1e1e1e',
                    color: above ? '#22c55e' : below ? '#ef4444' : '#333',
                  }}
                >
                  {above ? `+${Math.round((z.fgPct - 0.37) * 100)}` : below ? `−${Math.round((0.37 - z.fgPct) * 100)}` : 'AVG'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )

  function renderComparePanel({ p, z, s, sh, color }, idx) {
    return (
      <div className={`flex-1 flex flex-col items-center gap-2 min-w-0 overflow-hidden ${idx === 1 && mobileCompareTab !== 1 ? 'hidden md:flex' : ''} ${idx === 0 && mobileCompareTab !== 0 ? 'hidden md:flex' : ''}`}>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0 border" style={{ background: `${color}15`, borderColor: `${color}40`, color }}>
                {playerInitials(p.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] md:text-sm font-black truncate text-wnba-text">{p.name}</div>
                <div className="text-[9px] md:text-[10px] text-wnba-muted">{p.team}</div>
              </div>
            </div>
            {idx === 1 && (
              <button type="button" onClick={() => { setPlayerB(null); setZonesB([]); setStatsB(null); syncUrl(player, null) }} className="text-[10px] flex-shrink-0 ml-1 text-wnba-dim" aria-label="Remove comparison player">✕</button>
            )}
          </div>
          <div className="hidden md:block mb-2 space-y-1.5">
            {[
              { label: 'PPG', val: s?.PTS?.toFixed(1) ?? '—', max: 35, raw: s?.PTS },
              { label: 'FG%', val: s?.FG_PCT != null ? (s.FG_PCT * 100).toFixed(0) + '%' : '—', max: 100, raw: (s?.FG_PCT || 0) * 100 },
              { label: '3P%', val: s?.FG3_PCT != null ? (s.FG3_PCT * 100).toFixed(0) + '%' : '—', max: 60, raw: (s?.FG3_PCT || 0) * 100 },
              { label: 'AST', val: s?.AST?.toFixed(1) ?? '—', max: 12, raw: s?.AST },
            ].map(({ label, val, max, raw }) => {
              const pct = Math.min(100, ((raw ?? parseFloat(val)) / max) * 100) || 0
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[9px] font-black w-6 text-right text-wnba-dim">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-wnba-input">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
                  </div>
                  <span className="text-[10px] font-black w-8" style={{ color }}>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="w-full flex-1 flex flex-col items-center min-h-0">
          <CourtChart zones={z} shots={sh} filter={filter} view={view} compact />
          <CourtLegend view={view} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0 bg-wnba-bg">
      <div ref={announceRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      <div className="hidden md:block w-[290px] flex-shrink-0">{Sidebar}</div>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70"
        />
      )}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Player menu"
        className="md:hidden fixed left-0 top-0 h-full w-[85%] max-w-[320px] z-50 shadow-2xl transition-transform duration-250 flex flex-col"
        style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-wnba-border bg-wnba-surface">
          <span className="text-xs font-black text-wnba-muted uppercase tracking-widest">Players</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-10 h-10 rounded-lg border border-wnba-border-strong text-wnba-muted font-black"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0">{Sidebar}</div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 flex-shrink-0 flex items-center gap-2 md:gap-3 border-b border-wnba-border bg-wnba-surface">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-label="Open player menu"
            className="md:hidden h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 flex-shrink-0 bg-wnba-input border border-wnba-border-strong text-wnba-dim"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="text-[10px] font-black tracking-wide uppercase">Players</span>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black tracking-tight leading-tight text-wnba-text truncate">
              {player.name}
              {compareOn && playerB && <span className="text-wnba-dim"> vs </span>}
              {compareOn && playerB && <span>{playerB.name}</span>}
            </p>
          </div>

          <ShareLink playerId={player.id} compareId={playerB?.id} />

          <div className="flex items-center rounded-lg p-0.5 flex-shrink-0 bg-wnba-surface-elevated border border-wnba-border" role="group" aria-label="Chart view">
            {[['zones', 'Zones'], ['shots', 'Shots']].map(([v, lbl]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 h-9 rounded-md text-[11px] font-black transition-all ${view === v ? 'bg-wnba-orange text-white' : 'text-wnba-dim'}`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-pressed={compareOn}
            aria-label={compareOn ? 'Exit compare mode' : 'Compare players'}
            onClick={() => {
              const next = !compareOn
              setCompareOn(next)
              if (!next) {
                setPlayerB(null)
                setZonesB([])
                setStatsB(null)
                syncUrl(player, null)
              }
            }}
            className={`h-11 rounded-lg font-black transition-all flex-shrink-0 px-2 md:px-3 ${compareOn ? 'bg-wnba-orange text-white' : 'bg-wnba-surface-elevated border border-wnba-border-strong text-wnba-dim'}`}
          >
            <span className="md:hidden text-[11px] font-black">{compareOn ? '× Exit' : '⇄ vs'}</span>
            <span className="hidden md:inline text-xs">{compareOn ? '× Exit' : '⇄ Compare'}</span>
          </button>
        </div>

        {compareOn && !playerB && (
          <div className="px-4 py-3 border-b border-wnba-border bg-wnba-surface">
            <PlayerSearch
              allPlayers={allPlayers}
              teams={teams}
              team={teamB}
              onTeamChange={setTeamB}
              query={queryB}
              setQuery={setQueryB}
              onSelect={loadPlayerB}
              placeholder="Search second player..."
            />
          </div>
        )}

        <div className="flex justify-center gap-2 py-3 px-4 flex-shrink-0 overflow-x-auto bg-wnba-bg" role="group" aria-label="Zone filters">
          {FILTERS.map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              aria-pressed={filter === val}
              onClick={() => setFilter(val)}
              className={`px-4 min-h-[44px] rounded-full text-xs font-black transition-all flex-shrink-0 tracking-wide border ${
                filter === val ? 'bg-wnba-orange text-white border-wnba-orange' : 'bg-transparent border-wnba-border-strong text-wnba-dim'
              }`}
            >
              {val === 'hot' ? (
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 23c-3.9 0-7-3.1-7-7 0-2.5 1.4-4.7 3.5-5.8C7.4 8.2 8.5 5.5 11 4.1 11.3 7.1 13.5 9.5 16.2 10c-.3 1.2-1 2.2-2 2.9 2.2-.4 4-2 4.5-4.2 2.8 1.5 4.3 4.4 4.3 7.3 0 3.9-3.1 7-7 7z"/></svg>
                  Hot
                </span>
              ) : lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-hidden p-2 md:p-6 min-h-0 bg-wnba-bg">
          {loading ? (
            <LoadingSkeleton />
          ) : loadError ? (
            <PlayerLoadError message={loadError} onRetry={() => loadPlayer(player)} />
          ) : compareOn && playerB ? (
            <>
              <div className="md:hidden flex gap-1 mb-2 px-1" role="tablist" aria-label="Compare players">
                {[player, playerB].map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={mobileCompareTab === i}
                    onClick={() => setMobileCompareTab(i)}
                    className={`flex-1 min-h-[44px] rounded-lg text-[11px] font-black truncate px-2 ${
                      mobileCompareTab === i ? 'bg-wnba-orange text-white' : 'bg-wnba-surface-elevated text-wnba-dim border border-wnba-border'
                    }`}
                  >
                    {p.name.split(' ').pop()}
                  </button>
                ))}
              </div>
              <div className="flex flex-row gap-2 md:gap-6 h-full w-full">
                {[
                  { p: player, z: zones, s: stats, sh: shots, color: ORANGE },
                  { p: playerB, z: zonesB, s: statsB, sh: shotsB, color: '#3b82f6' },
                ].map((panel, idx) => renderComparePanel(panel, idx))}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full w-full">
              <div className="flex flex-col items-center flex-1 min-h-0 md:justify-center">
                <CourtChart zones={zones} shots={shots} filter={filter} view={view} />
                <CourtLegend view={view} />
              </div>
              {stats && (
                <div className="md:hidden flex gap-2 px-2 pb-3 pt-2 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {[
                    { v: stats.PTS?.toFixed(1) ?? '—', l: 'PPG', c: ORANGE },
                    { v: stats.FG_PCT != null ? (stats.FG_PCT * 100).toFixed(0) + '%' : '—', l: 'FG%', c: '#22c55e' },
                    { v: stats.FG3_PCT != null ? (stats.FG3_PCT * 100).toFixed(0) + '%' : '—', l: '3P%', c: '#a855f7' },
                    { v: stats.AST?.toFixed(1) ?? '—', l: 'AST', c: '#3b82f6' },
                    { v: stats.REB?.toFixed(1) ?? '—', l: 'REB', c: '#f59e0b' },
                  ].map(({ v, l, c }) => (
                    <div key={l} className="flex-1 rounded-xl p-2.5 text-center bg-wnba-surface-elevated border border-wnba-border" style={{ borderTop: `2px solid ${c}` }}>
                      <div className="text-base font-black leading-none" style={{ color: c }}>{v}</div>
                      <div className="text-[9px] font-bold tracking-widest uppercase mt-1 text-wnba-muted">{l}</div>
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

export default function ShotTracker() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-wnba-dim text-sm">Loading…</div>}>
      <ShotTrackerInner />
    </Suspense>
  )
}
