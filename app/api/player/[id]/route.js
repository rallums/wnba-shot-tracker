import { kv } from '@vercel/kv'
import { rowToZones } from '@/lib/zones'

export async function GET(request, { params }) {
  const { id } = params
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const [row, stats] = await Promise.all([
    kv.get(`player:${id}:zones:2026`).catch(() => null),
    kv.get(`player:${id}:stats:2026`).catch(() => null),
  ])
  if (!row) return Response.json({ zones: [], stats: null }, { status: 404 })

  const zones = rowToZones(row)
  return Response.json({ zones, stats })
}
