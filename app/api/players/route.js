import { kv } from '@vercel/kv'
import { getAllPlayers } from '@/lib/wnba-api'

export async function GET() {
  const cached = await kv.get('players:2026').catch(() => null)
  if (cached) return Response.json(cached)

  const players = await getAllPlayers()
  const clean = players.map(p => ({
    id: p.PERSON_ID,
    name: p.DISPLAY_FIRST_LAST,
    team: p.TEAM_NAME,
    abbr: p.TEAM_ABBREVIATION,
  }))

  await kv.set('players:2026', clean, { ex: 86400 }).catch(() => {})
  return Response.json(clean)
}
