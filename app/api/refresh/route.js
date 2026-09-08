import { kv } from '@vercel/kv'
import { timingSafeEqual } from 'crypto'

const TTL = 60 * 60 * 24 * 8 // 8 days

export async function POST(request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  const valid = secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  if (!valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { allZones, leaders, players, shotsByPlayer, schedule } = body

    const isValidId = id => /^\d+$/.test(String(id))

    if (schedule?.length) {
      // Full season schedule — long TTL (re-seed updates status of past games)
      await kv.set('schedule:season:2026', schedule, { ex: 60 * 60 * 24 * 60 })
    }

    if (players?.length) {
      await kv.set('players:2026', players, { ex: TTL })
    }

    await Promise.all(
      allZones.filter(row => isValidId(row.PLAYER_ID)).map(row =>
        kv.set(`player:${row.PLAYER_ID}:zones:2026`, row, { ex: TTL })
      )
    )

    // Store per-player stats for individual lookups
    await Promise.all(
      leaders.filter(p => isValidId(p.PLAYER_ID)).map(p =>
        kv.set(`player:${p.PLAYER_ID}:stats:2026`, p, { ex: TTL })
      )
    )

    // Store per-player shot lists
    if (shotsByPlayer) {
      await Promise.all(
        Object.entries(shotsByPlayer)
          .filter(([pid]) => isValidId(pid))
          .map(([pid, shots]) =>
            kv.set(`player:${pid}:shots:2026`, shots, { ex: TTL })
          )
      )
    }

    const sorted = leaders
      .filter(p => p.GP >= 5)
      .sort((a, b) => b.FG3_PCT - a.FG3_PCT)
      .slice(0, 20)
    await kv.set('league:leaders:2026', sorted, { ex: TTL })

    const timestamp = new Date().toISOString()
    await kv.set('meta:last_updated', timestamp)

    return Response.json({ refreshed: allZones.length, timestamp })
  } catch (err) {
    console.error('[refresh]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
