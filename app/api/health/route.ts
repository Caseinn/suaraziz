import { NextResponse } from "next/server"
import { getRedis } from "@/lib/redis"

export const dynamic = "force-dynamic"

const REDIS_TIMEOUT_MS = 1500

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Redis timeout")), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

export async function GET() {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json(
      { ok: false, redis: "disabled" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }

  const startedAt = Date.now()
  try {
    const pong = await withTimeout(redis.ping(), REDIS_TIMEOUT_MS)
    return NextResponse.json(
      { ok: true, redis: "ok", pong, latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redis error"
    return NextResponse.json(
      { ok: false, redis: "error", error: message, latencyMs: Date.now() - startedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}