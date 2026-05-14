import { kv } from '@vercel/kv'

export async function GET() {
  const lastUpdated = await kv.get('meta:last_updated').catch(() => null)
  return Response.json({ lastUpdated })
}
