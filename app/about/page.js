import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'About — WNBA Shots',
  description: 'How WNBA Shots works: data sources, architecture, and update cadence.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full bg-wnba-bg text-wnba-text font-body">
      <header className="h-[52px] flex items-center px-4 md:px-6 border-b border-wnba-border bg-wnba-surface">
        <Link href="/" className="font-display font-black text-white tracking-tight text-[15px]">
          WNBA<span className="text-wnba-orange">SHOTS</span>
        </Link>
      </header>

      <article className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-2xl mx-auto prose prose-invert prose-sm">
        <h1 className="font-display text-2xl font-black text-white mb-4">How it works</h1>

        <p className="text-wnba-muted leading-relaxed mb-4">
          WNBA Shots is a read-only dashboard for 2026 season shot zones and charts. There are no user accounts
          and no data stored in your browser beyond optional analytics consent.
        </p>

        <h2 className="font-display text-lg font-black text-white mt-6 mb-2">Data flow</h2>
        <ol className="list-decimal list-inside space-y-2 text-wnba-muted text-sm">
          <li>
            <strong className="text-wnba-text">Ingestion</strong> — A local seed script pulls player lists, zone stats,
            shot coordinates, and schedules from the unofficial WNBA stats API (stats.wnba.com), which blocks many cloud IPs.
          </li>
          <li>
            <strong className="text-wnba-text">Storage</strong> — Data is written to Vercel KV (Redis) via a protected
            <code className="text-wnba-orange"> POST /api/refresh</code> endpoint using a bearer secret.
          </li>
          <li>
            <strong className="text-wnba-text">Your visit</strong> — The site reads cached data through
            <code className="text-wnba-orange"> /api/players</code>,{' '}
            <code className="text-wnba-orange"> /api/player/[id]</code>,{' '}
            <code className="text-wnba-orange"> /api/schedule</code>, and{' '}
            <code className="text-wnba-orange"> /api/meta</code>. Charts show season totals unless game filters are added later.
          </li>
        </ol>

        <h2 className="font-display text-lg font-black text-white mt-6 mb-2">Update cadence</h2>
        <p className="text-wnba-muted text-sm leading-relaxed">
          Data is refreshed on a weekly schedule (not play-by-play). The sidebar shows the last seed date when available.
          If a player was recently added to the league, their chart may show “data not available” until the next update.
        </p>

        <h2 className="font-display text-lg font-black text-white mt-6 mb-2">Prop context</h2>
        <p className="text-wnba-muted text-sm leading-relaxed">
          The “Prop context” panel uses simple heuristics from season averages and zone efficiency. It is for entertainment
          and education only — not betting advice.
        </p>

        <p className="mt-8">
          <Link href="/" className="text-wnba-orange font-bold text-sm hover:underline">← Back to charts</Link>
        </p>
      </article>

      <SiteFooter />
    </div>
  )
}
