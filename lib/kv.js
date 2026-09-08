import { createClient } from '@vercel/kv'

// Support both @vercel/kv naming (KV_REST_API_*) and Upstash native naming (UPSTASH_REDIS_REST_*)
export const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
})
