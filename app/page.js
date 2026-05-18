import ShotTracker from '@/components/ShotTracker'
import LiveTicker from '@/components/LiveTicker'

export default function Page() {
  return (
    <main className="flex flex-col h-full">
      <LiveTicker />
      <nav className="h-[52px] flex items-center justify-between px-4 md:px-6 border-b border-[#1e1e1e]"
        style={{ background: '#0d0d0d' }}>
        <div className="flex items-center gap-3">
          <span className="font-black text-white tracking-tight" style={{ fontSize: '15px' }}>WNBA<span style={{ color: '#F57B20' }}>SHOTS</span></span>
          <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border"
            style={{ color: '#F57B20', borderColor: '#F57B20', opacity: 0.7 }}>2026</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: '#333' }}>
          <span>Shot Tracker</span>
          <span style={{ color: '#F57B20' }}>↗</span>
        </div>
      </nav>
      <ShotTracker />
    </main>
  )
}
