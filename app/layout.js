import './globals.css'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wnba-shot-tracker-947a.vercel.app'),
  title: 'WNBA Shot Tracker — 2026 Season',
  description: 'Interactive shot zone charts for every WNBA player. 2026 season data updated every Monday.',
  openGraph: {
    title: 'WNBA Shot Tracker — 2026 Season',
    description: 'Interactive shot zone charts for every WNBA player. 2026 season data updated every Monday.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'WNBA Shot Tracker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WNBA Shot Tracker — 2026 Season',
    description: 'Interactive shot zone charts for every WNBA player.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
