// app/api/reviews/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"
import { getRequestIp, isTrustedOrigin, rateLimit } from "@/lib/security"

export const dynamic = "force-dynamic"

const BODY_MAX = 800
const BODY_MAX_BYTES = 10_000

export async function GET(req: Request) {
  const ip = getRequestIp(req)
  if (ip !== "unknown") {
    const { success, reset } = await rateLimit(`reviews:get:${ip}`, { limit: 120, windowMs: 60_000 })
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }
  }

  const url = new URL(req.url)
  const trackId = url.searchParams.get("trackId")
  const limitParam = url.searchParams.get("limit")
  const cursorId = url.searchParams.get("cursor")
  if (!trackId) return NextResponse.json({ items: [], avg: null, nextCursor: null })
  const limit = Math.max(1, Math.min(Number(limitParam) || 10, 50))
  const take = limit + 1
  const [itemsPlusOne, avgAgg] = await Promise.all([
    prisma.review.findMany({
      where: { trackId },
      select: {
        id: true,
        trackId: true,
        authorId: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, displayName: true, image: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take,
    }),
    prisma.review.aggregate({ where: { trackId }, _avg: { rating: true } }),
  ])
  let nextCursor: string | null = null
  let items = itemsPlusOne
  if (itemsPlusOne.length > limit) {
    const nextItem = itemsPlusOne[itemsPlusOne.length - 1]
    nextCursor = nextItem.id
    items = itemsPlusOne.slice(0, limit)
  }
  return NextResponse.json({
    items,
    avg: avgAgg._avg.rating ?? null,
    nextCursor,
  })
}

export async function POST(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 })
  }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success, reset } = await rateLimit(`reviews:create:${userId}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0")
  if (contentLength > BODY_MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  const { trackId, rating, title, body } = await req.json()

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 })
  }

  const r = Number(rating)
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
  }

  const b = String(body ?? "")
  if (b.length === 0 || b.length > BODY_MAX) {
    return NextResponse.json({ error: "Invalid body length" }, { status: 400 })
  }

  const existing = await prisma.review.findFirst({
    where: { trackId, authorId: userId },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: "Review already exists" }, { status: 409 })
  }

  await prisma.track.upsert({
    where: { id: trackId },
    create: { id: trackId, name: "Unknown", artists: [], album: "" },
    update: {},
  })

  const review = await prisma.review.create({
    data: { trackId, rating: r, title: title ?? null, body: b, authorId: userId },
    select: {
      id: true,
      trackId: true,
      authorId: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, displayName: true, image: true } },
    },
  })

  // Revalidate the track page so avg/header and first page update
  revalidatePath(`/track/${trackId}`)

  return NextResponse.json({ review })
}
