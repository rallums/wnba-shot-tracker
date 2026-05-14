import { kv } from '@vercel/kv'

const TTL = 60 * 60 * 24 * 8 // 8 days

export async function POST(request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { allZones, leaders, players } = await request.json()

    if (players?.length) {
      await kv.set('players:2026', players, { ex: TTL })
    }

    await Promise.all(
      allZones.map(row =>
        kv.set(`player:${row.PLAYER_ID}:zones:2026`, row, { ex: TTL })
      )
    )

    const sorted = leaders
      .filter(p => p.GP >= 5)
      .sort((a, b) => b.FG3_PCT - a.FG3_PCT)
      .slice(0, 20)
    await kv.set('league:leaders:2026', sorted, { ex: TTL })

    const timestamp = new Date().toISOString()
    await kv.set('meta:last_updated', timestamp)

    return Response.json({ refreshed: allZones.length, timestamp })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
