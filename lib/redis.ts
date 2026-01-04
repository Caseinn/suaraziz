import { Redis } from "@upstash/redis"

type GlobalRedis = {
  __redis?: Redis
}

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const globalForRedis = globalThis as unknown as GlobalRedis
  if (!globalForRedis.__redis) {
    globalForRedis.__redis = new Redis({ url, token })
  }
  return globalForRedis.__redis
}
