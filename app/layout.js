import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wnba-shot-tracker-947a.vercel.app'),
  title: 'WNBA Shots — Every Shot. Every Player. [Beta]',
  description: 'Interactive shot zone charts for every WNBA player. See hot zones, shooting percentages by area, and prop bet leans. 2026 season data updated weekly.',
  openGraph: {
    title: 'WNBA Shots — Every Shot. Every Player.',
    description: 'Interactive shot zone charts for every WNBA player. See hot zones, shooting percentages by area, and prop bet leans. 2026 season data updated weekly.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'WNBA Shots — Every Shot. Every Player.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WNBA Shots — Every Shot. Every Player.',
    description: 'Interactive shot zone charts for every WNBA player. Hot zones, shooting %, and prop bet leans. 2026 season.',
    images: ['/og-image.png'],
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive"/>
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  )
}
