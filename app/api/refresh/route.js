import { kv } from '@vercel/kv'
import { getAllZoneShooting, getLeagueLeaders } from '@/lib/wnba-api'

const TTL = 60 * 60 * 24 * 8 // 8 days — survives until next Monday

// Triggered every Monday by GitHub Actions cron
export async function POST(request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // One API call gets zone data for every player — no per-player loop needed
    const [allZones, leaders] = await Promise.all([
      getAllZoneShooting(),
      getLeagueLeaders(),
    ])

    // Write each player's zone row to KV
    await Promise.all(
      allZones.map(row =>
        kv.set(`player:${row.PLAYER_ID}:zones:2026`, row, { ex: TTL })
      )
    )

    // Leaderboard: top 20 by 3P%
    const sorted = leaders
      .filter(p => p.GP >= 5)
      .sort((a, b) => b.FG3_PCT - a.FG3_PCT)
      .slice(0, 20)
    await kv.set('league:leaders:2026', sorted, { ex: TTL })

    // Stamp last updated
    const timestamp = new Date().toISOString()
    await kv.set('meta:last_updated', timestamp)

    return Response.json({ refreshed: allZones.length, timestamp })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
