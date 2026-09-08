'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { POPULAR_PLAYER_IDS } from '@/lib/constants'
import { playerInitials } from '@/lib/format'

const MAX_RESULTS = 12

export default function PlayerSearch({
  allPlayers,
  teams,
  team,
  onTeamChange,
  query,
  setQuery,
  onSelect,
  placeholder,
  popularIds = POPULAR_PLAYER_IDS,
}) {
  const [show, setShow] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  const popular = useMemo(
    () => popularIds.map(id => allPlayers.find(p => p.id === id)).filter(Boolean),
    [allPlayers, popularIds]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = allPlayers.filter(p => team === 'all' || p.team === team)
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q))
    else if (show && popular.length) {
      const popularSet = new Set(popular.map(p => p.id))
      const rest = list.filter(p => !popularSet.has(p.id))
      return [...popular, ...rest].slice(0, MAX_RESULTS)
    }
    return list.slice(0, MAX_RESULTS)
  }, [allPlayers, team, query, show, popular])

  useEffect(() => {
    setHighlight(0)
  }, [filtered.length, query, team])

  function selectPlayer(p) {
    onSelect(p)
    setShow(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function onKeyDown(e) {
    if (!show || filtered.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setShow(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectPlayer(filtered[highlight])
    } else if (e.key === 'Escape') {
      setShow(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[highlight]
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  const listId = 'player-search-list'

  return (
    <div className="space-y-2">
      {onTeamChange && (
        <select
          value={team}
          onChange={e => onTeamChange(e.target.value)}
          aria-label="Filter by team"
          className="w-full h-8 rounded-lg px-2 text-xs font-semibold outline-none bg-wnba-input border border-wnba-border-strong text-wnba-muted"
        >
          <option value="all">All teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wnba-muted" aria-hidden>⌕</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={show && filtered.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full h-9 rounded-lg pl-8 pr-3 text-sm outline-none transition-all bg-wnba-input border border-wnba-border-strong text-wnba-text focus:border-wnba-orange"
          placeholder={placeholder || 'Search player...'}
          value={query}
          onChange={e => { setQuery(e.target.value); setShow(true) }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
          onKeyDown={onKeyDown}
        />
        {show && filtered.length > 0 && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            className="absolute top-10 left-0 right-0 max-h-64 overflow-y-auto rounded-xl z-50 bg-wnba-surface-elevated border border-wnba-border-strong shadow-xl"
          >
            {!query.trim() && popular.length > 0 && (
              <li className="px-3 py-1.5 text-[9px] font-black tracking-widest uppercase text-wnba-dim border-b border-wnba-border">
                Popular
              </li>
            )}
            {filtered.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={() => selectPlayer(p)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-wnba-border last:border-0 ${
                  i === highlight ? 'bg-wnba-input' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 bg-wnba-border border border-wnba-orange/30 text-wnba-orange">
                  {playerInitials(p.name)}
                </div>
                <div>
                  <div className="text-sm font-bold text-wnba-text">{p.name}</div>
                  <div className="text-[11px] text-wnba-muted">{p.team}</div>
                </div>
                <span className="ml-auto text-xs text-wnba-muted" aria-hidden>→</span>
              </li>
            ))}
          </ul>
        )}
        {show && query.trim() && filtered.length === 0 && (
          <div className="absolute top-10 left-0 right-0 rounded-xl px-3 py-2.5 z-50 bg-wnba-surface-elevated border border-wnba-border-strong text-xs text-wnba-muted">
            No players found
          </div>
        )}
      </div>
    </div>
  )
}
