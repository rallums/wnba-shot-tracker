import { kv } from '@vercel/kv'

export async function GET() {
  const games = await kv.get('schedule:today:2026').catch(() => null)
  return Response.json({ games: games || [] })
}
