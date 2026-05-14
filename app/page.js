import ShotTracker from '@/components/ShotTracker'

export default function Page() {
  return (
    <main>
      <nav className="h-[54px] flex items-center px-3 md:px-6 gap-2"
        style={{ background: 'linear-gradient(135deg, #1a2580 0%, #2b3db0 100%)', boxShadow: '0 2px 12px rgba(30,45,125,0.4)' }}>
        <div className="flex items-center gap-2 text-white min-w-0">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm md:text-base flex-shrink-0">🏀</div>
          <span className="font-bold text-sm md:text-base whitespace-nowrap">WNBA Shot Tracker</span>
          <span className="hidden sm:inline text-[11px] font-semibold bg-white/20 text-white/80 px-2 py-0.5 rounded whitespace-nowrap">2026 Season</span>
        </div>
      </nav>
      <ShotTracker />
    </main>
  )
}
