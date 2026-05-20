import { kv } from '@vercel/kv'

export async function GET() {
  const season = await kv.get('schedule:season:2026').catch(() => null)
  if (!season?.length) return Response.json({ games: [], label: 'TODAY' })

  const todayISO = new Date().toLocaleDateString('en-CA') // "2026-05-20"

  // Today's games first
  const todayGames = season.filter(g => g.date === todayISO)
  if (todayGames.length) {
    return Response.json({ games: todayGames, label: 'TODAY' })
  }

  // Next upcoming game date within 14 days
  const future = season
    .filter(g => g.date > todayISO && g.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!future.length) return Response.json({ games: [], label: 'TODAY' })

  const nextDate = future[0].date
  const nextGames = future.filter(g => g.date === nextDate)

  // Format label: "MAY 22"
  const [yyyy, mm, dd] = nextDate.split('-')
  const label = new Date(+yyyy, +mm - 1, +dd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

  return Response.json({ games: nextGames, label: `NEXT · ${label}` })
}
