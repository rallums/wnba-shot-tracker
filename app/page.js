import { Suspense } from 'react'
import Link from 'next/link'
import ShotTracker from '@/components/ShotTracker'
import LiveTicker from '@/components/LiveTicker'
import SiteFooter from '@/components/SiteFooter'

export default function Page() {
  return (
    <main className="flex flex-col h-full font-body">
      <LiveTicker />
      <nav className="h-[52px] flex items-center justify-between px-4 md:px-6 border-b border-wnba-border bg-wnba-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-white tracking-tight text-[15px]">
            WNBA<span className="text-wnba-orange">SHOTS</span>
          </span>
          <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border text-wnba-orange border-wnba-orange/70 opacity-70">2026</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-wnba-muted">
          <Link href="/about" className="hover:text-wnba-orange transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-wnba-orange transition-colors">Privacy</Link>
        </div>
      </nav>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-wnba-dim">Loading charts…</div>}>
        <ShotTracker />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
