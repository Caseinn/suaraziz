// app/api/reviews/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

const BODY_MAX = 600

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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
  const userId = await requireUserId()
  const { id: reviewId } = await ctx.params
  const { body } = await req.json()

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
