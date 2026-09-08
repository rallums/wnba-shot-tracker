import { createClient } from '@vercel/kv'

// Support both @vercel/kv naming (KV_REST_API_*) and Upstash native naming (UPSTASH_REDIS_REST_*)
export const kv = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
})
