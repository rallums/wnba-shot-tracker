'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import Link from 'next/link'

const STORAGE_KEY = 'wnbashots-analytics-consent'
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export function AnalyticsScripts() {
  const [consent, setConsent] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'accepted' || stored === 'declined') setConsent(stored)
      else setConsent('pending')
    } catch {
      setConsent('pending')
    }
  }, [])

  if (consent !== 'accepted') return null

  return (
    <>
      <Analytics />
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true, allow_google_signals: false });
          `}</Script>
        </>
      )}
    </>
  )
}

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'accepted' || stored === 'declined') setConsent(stored)
      else setConsent('pending')
    } catch {
      setConsent('pending')
    }
  }, [])

  if (consent !== 'pending') return null

  function choose(value) {
    try { localStorage.setItem(STORAGE_KEY, value) } catch {}
    setConsent(value)
    if (value === 'accepted') window.location.reload()
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed bottom-0 inset-x-0 z-[100] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-wnba-border bg-wnba-surface-elevated p-4 shadow-2xl">
        <p className="text-sm text-wnba-text leading-relaxed">
          We use anonymous analytics (Vercel{GA_ID ? ' and Google Analytics' : ''}) to understand how the site is used.
          No account or personal data is required.{' '}
          <Link href="/privacy" className="text-wnba-orange underline underline-offset-2">Privacy policy</Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="min-h-[44px] px-4 rounded-lg text-xs font-black bg-wnba-orange text-white"
          >
            Accept analytics
          </button>
          <button
            type="button"
            onClick={() => choose('declined')}
            className="min-h-[44px] px-4 rounded-lg text-xs font-black border border-wnba-border text-wnba-muted"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
