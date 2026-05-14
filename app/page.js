export const dynamic = 'force-dynamic'

import ShotTracker from '@/components/ShotTracker'
import { getAllPlayers } from '@/lib/wnba-api'

export default async function Page() {
  // Pre-fetch player list server-side for instant search autocomplete
  let players = []
  try {
    const raw = await getAllPlayers()
    players = raw.map(p => ({
      id: p.PERSON_ID,
      name: p.DISPLAY_FIRST_LAST,
      team: p.TEAM_NAME,
      abbr: p.TEAM_ABBREVIATION,
    }))
  } catch {
    // WNBA API unreachable — client will still work with fallback data
  }

  return (
    <main>
      <nav className="h-[54px] flex items-center px-6 gap-4"
        style={{ background: 'linear-gradient(135deg, #1a2580 0%, #2b3db0 100%)', boxShadow: '0 2px 12px rgba(30,45,125,0.4)' }}>
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-base">🏀</div>
          <span className="font-bold text-base">WNBA Shot Tracker</span>
          <span className="text-[11px] font-semibold bg-white/20 text-white/80 px-2 py-0.5 rounded">2026 Season</span>
        </div>
        <div className="ml-auto flex gap-1">
          {['🗺 Court', '📋 Players', 'ℹ About'].map((label, i) => (
            <button key={label}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all
                ${i === 0 ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </nav>
      <ShotTracker initialPlayers={players}/>
    </main>
  )
}
