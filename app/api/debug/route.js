import { kv } from '@/lib/kv'

export async function GET() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  const envStatus = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    resolvedUrl: url ? url.slice(0, 40) + '...' : null,
  }

  let kvTest = null
  let kvError = null
  try {
    const result = await kv.get('player:1628932:zones:2026')
    kvTest = result ? 'FOUND' : 'NULL (key missing)'
  } catch (e) {
    kvError = e.message
  }

  let playerCount = null
  try {
    const players = await kv.get('players:2026')
    playerCount = Array.isArray(players) ? players.length : typeof players
  } catch {}

  return Response.json({ envStatus, kvTest, kvError, playerCount })
}
