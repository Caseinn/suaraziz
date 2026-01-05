// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"
import { isTrustedOrigin, rateLimit } from "@/lib/security"

export const dynamic = "force-dynamic"

type PatchBody = {
  title?: string | null
  body?: string
  rating?: number
}

const BODY_MAX = 800
const BODY_MAX_BYTES = 10_000

export async function PATCH(
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

  const { success, reset } = await rateLimit(`reviews:update:${userId}`, {
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
  const { id } = await ctx.params  // ⬅️ await

  const contentLength = Number(req.headers.get("content-length") ?? "0")
  if (contentLength > BODY_MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  const raw = await req.text()
  if (Buffer.byteLength(raw, "utf8") > BODY_MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  let payload: PatchBody
  try {
    payload = raw ? (JSON.parse(raw) as PatchBody) : {}
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true, trackId: true },
  })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data: PatchBody = {}
  if (typeof payload.title !== "undefined") data.title = payload.title ?? null
  if (typeof payload.body !== "undefined") {
    const b = String(payload.body ?? "")
    if (b.length === 0 || b.length > BODY_MAX) {
      return NextResponse.json({ error: "Invalid body length" }, { status: 400 })
    }
    data.body = b
  }
  if (typeof payload.rating !== "undefined") {
    const r = Number(payload.rating)
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
    }
    data.rating = r
  }

  const review = await prisma.review.update({
    where: { id },
    data,
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

  revalidatePath(`/track/${exists.trackId}`)
  return NextResponse.json({ review })
}

export async function DELETE(
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

  const { success, reset } = await rateLimit(`reviews:delete:${userId}`, {
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
  const { id } = await ctx.params  // ⬅️ await

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true, trackId: true },
  })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  revalidatePath(`/track/${exists.trackId}`)
  return NextResponse.json({ ok: true })
}
