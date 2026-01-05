// app/api/reviews/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"
import { getRequestIp, isTrustedOrigin, rateLimit } from "@/lib/security"

export const dynamic = "force-dynamic"

const BODY_MAX = 600
const BODY_MAX_BYTES = 10_000

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ip = getRequestIp(req)
  const key = ip === "unknown" ? "unknown" : ip
  const { success, reset } = await rateLimit(`comments:get:${key}`, { limit: 120, windowMs: 60_000 })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const { id: reviewId } = await ctx.params
  const url = new URL(req.url)
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit")) || 10, 50))
  const cursor = url.searchParams.get("cursor") || null
  const take = limit + 1

  const rows = await prisma.comment.findMany({
    where: { reviewId },
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  })

  let nextCursor: string | null = null
  let items = rows
  if (rows.length > limit) {
    nextCursor = rows[rows.length - 1].id
    items = rows.slice(0, limit)
  }

  return NextResponse.json({ items, nextCursor })
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 })
  }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success, reset } = await rateLimit(`comments:create:${userId}`, {
    limit: 40,
    windowMs: 60_000,
  })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const { id: reviewId } = await ctx.params
  const contentLength = Number(req.headers.get("content-length") ?? "0")
  if (contentLength > BODY_MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  const raw = await req.text()
  if (Buffer.byteLength(raw, "utf8") > BODY_MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  let parsed: { body?: string }
  try {
    parsed = raw ? (JSON.parse(raw) as { body?: string }) : {}
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { body } = parsed

  const b = String(body ?? "").trim()
  if (!b || b.length > BODY_MAX) {
    return NextResponse.json({ error: "Invalid body length" }, { status: 400 })
  }

  // ensure review exists + get its trackId (for revalidate later)
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { trackId: true },
  })
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })

  const comment = await prisma.comment.create({
    data: { authorId: userId, reviewId, body: b },
    include: { author: { select: { id: true, name: true, image: true } } },
  })

  // revalidate the track page so counts / lists refresh on first page
  revalidatePath(`/track/${review.trackId}`)
  return NextResponse.json({ comment })
}
