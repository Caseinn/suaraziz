type RateLimitOptions = {
  limit: number
  windowMs: number
}

import { getRedis } from "@/lib/redis"

const isProd = process.env.NODE_ENV === "production"

const allowedOrigin = (() => {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  try {
    return new URL(raw).origin
  } catch {
    return "http://localhost:3000"
  }
})()

const allowedOrigins = new Set<string>([allowedOrigin])
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000")
  allowedOrigins.add("http://127.0.0.1:3000")
}

export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return false
  return allowedOrigins.has(origin)
}

const trustProxy = process.env.TRUST_PROXY === "1" || process.env.VERCEL === "1"

export function getRequestIp(req: Request): string {
  if (!trustProxy) return "unknown"
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-vercel-ip") ??
    "unknown"
  )
}

export async function rateLimit(key: string, options: RateLimitOptions) {
  const redis = getRedis()
  const now = Date.now()
  if (!redis) {
    if (isProd) {
      return { success: false, remaining: 0, reset: now + options.windowMs }
    }
    return { success: true, remaining: options.limit, reset: now + options.windowMs }
  }

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.pexpire(key, options.windowMs)
  }

  const ttl = await redis.pttl(key)
  const reset = ttl > 0 ? now + ttl : now + options.windowMs
  if (count > options.limit) {
    return { success: false, remaining: 0, reset }
  }

  return { success: true, remaining: Math.max(0, options.limit - count), reset }
}
