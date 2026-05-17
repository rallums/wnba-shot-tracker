'use client'

import { useEffect, useState } from 'react'

export default function LiveTicker() {
  const [games, setGames] = useState([])

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(d => {
      if (d.games?.length) setGames(d.games)
    }).catch(() => {})
  }, [])

  if (!games.length) return null

  // Duplicate the array for seamless scroll
  const loop = [...games, ...games]

  return (
    <div className="bg-black/90 overflow-hidden border-b border-orange-500/30 relative">
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          50%      { opacity: 0.6; box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }
        .ticker-track { animation: ticker-scroll 60s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
      `}</style>

      <div className="ticker-track flex whitespace-nowrap py-1.5">
        {loop.map((g, i) => {
          const liveColor = g.status === 'live'     ? 'text-emerald-300'
                          : g.status === 'final'    ? 'text-gray-500'
                          :                            'text-white'
          return (
            <div key={i} className="flex items-center gap-2 px-5 text-[12px] font-medium flex-shrink-0">
              {g.status === 'live' && (
                <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 inline-block"/>
              )}
              {g.status === 'final' && <span className="text-[9px] font-bold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">FINAL</span>}
              <span className={`font-bold ${liveColor}`}>{g.away} @ {g.home}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-300">{g.time}</span>
              <span className="text-gray-400">·</span>
              <span className="text-orange-300">{g.channel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
