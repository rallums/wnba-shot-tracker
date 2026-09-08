import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="flex-shrink-0 border-t border-wnba-border bg-wnba-surface px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-wnba-muted">
        <span>2026 season</span>
        <nav className="flex flex-wrap gap-3 font-semibold" aria-label="Site links">
          <Link href="/about" className="hover:text-wnba-orange transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-wnba-orange transition-colors">Privacy</Link>
          <a
            href="https://stats.wnba.com"
            className="hover:text-wnba-orange transition-colors"
            rel="noopener noreferrer"
            target="_blank"
          >
            Data source
          </a>
        </nav>
      </div>
    </footer>
  )
}
