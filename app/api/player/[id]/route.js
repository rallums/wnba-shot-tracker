import { kv } from '@vercel/kv'
import { getShotChart, getPlayerStats } from '@/lib/wnba-api'
import { aggregateShots } from '@/lib/zones'

export async function GET(request, { params }) {
  const { id } = params
  const cacheKey = `player:${id}:shots:2026`

  // Serve from cache if available
  const cached = await kv.get(cacheKey).catch(() => null)
  if (cached) return Response.json(cached)

  // Live fetch (fallback during initial load / cache miss)
  try {
    const [shots, stats] = await Promise.all([
      getShotChart(id),
      getPlayerStats(id),
    ])
    const zones = aggregateShots(shots)
    const payload = { zones, stats, totalShots: shots.length }

    // Cache for 24h
    await kv.set(cacheKey, payload, { ex: 86400 }).catch(() => {})

    return Response.json(payload)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
