import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Privacy — WNBA Shots',
  description: 'Privacy policy for WNBA Shots: what we collect, third parties, and your choices.',
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-full bg-wnba-bg text-wnba-text font-body">
      <header className="h-[52px] flex items-center px-4 md:px-6 border-b border-wnba-border bg-wnba-surface">
        <Link href="/" className="font-display font-black text-white tracking-tight text-[15px]">
          WNBA<span className="text-wnba-orange">SHOTS</span>
        </Link>
      </header>

      <article className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-2xl mx-auto text-sm">
        <h1 className="font-display text-2xl font-black text-white mb-4">Privacy policy</h1>
        <p className="text-wnba-muted mb-4">Last updated: June 2026</p>

        <section className="space-y-3 text-wnba-muted leading-relaxed">
          <h2 className="font-display text-lg font-black text-white">What we collect</h2>
          <p>
            WNBA Shots does not require an account. We do not ask for your name, email, or payment information.
            If you accept analytics in the consent banner, we may collect anonymous usage data such as page views,
            referrer, browser type, and general device information.
          </p>

          <h2 className="font-display text-lg font-black text-white pt-4">Third-party services</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-wnba-text">Vercel Analytics</strong> — optional, only after you accept</li>
            <li><strong className="text-wnba-text">Google Analytics 4</strong> — only if enabled by the site operator and you accept; IP anonymization is configured when used</li>
            <li><strong className="text-wnba-text">Vercel KV</strong> — server-side cache of public WNBA stats (no visitor PII)</li>
          </ul>

          <h2 className="font-display text-lg font-black text-white pt-4">Local storage</h2>
          <p>
            Your analytics choice (accept or decline) is stored in <code className="text-wnba-orange">localStorage</code> under
            the key <code className="text-wnba-orange">wnbashots-analytics-consent</code> so we do not ask on every visit.
            No other client-side storage is used for tracking.
          </p>

          <h2 className="font-display text-lg font-black text-white pt-4">Basketball data</h2>
          <p>
            Shot and stat data come from the unofficial WNBA stats API (stats.wnba.com), proxied through this site’s APIs
            as weekly snapshots. We do not sell personal data.
          </p>

          <h2 className="font-display text-lg font-black text-white pt-4">Your choices</h2>
          <p>
            Decline analytics in the banner to avoid third-party scripts. You can clear site data in your browser to reset
            your choice. EU/UK/CA visitors: analytics load only after explicit opt-in.
          </p>

          <h2 className="font-display text-lg font-black text-white pt-4">Contact</h2>
          <p>
            Questions about this policy can be sent via the project repository issues page.
          </p>
        </section>

        <p className="mt-8">
          <Link href="/" className="text-wnba-orange font-bold hover:underline">← Back to charts</Link>
        </p>
      </article>

      <SiteFooter />
    </div>
  )
}
