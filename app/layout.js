import './globals.css'

export const metadata = {
  title: 'WNBA Shot Tracker — 2026 Season',
  description: 'Interactive shot zone charts for every WNBA player. 2026 season data updated every Monday.',
  openGraph: {
    title: 'WNBA Shot Tracker',
    description: '2026 season shot charts for every WNBA player',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
