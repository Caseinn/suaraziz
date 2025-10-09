// app/api/reviews/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

const BODY_MAX = 800

export async function GET(req: Request) {
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
      include: { author: true },
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
  const userId = await requireUserId()
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

  await prisma.track.upsert({
    where: { id: trackId },
    create: { id: trackId, name: "Unknown", artists: [], album: "" },
    update: {},
  })

  const review = await prisma.review.create({
    data: { trackId, rating: r, title: title ?? null, body: b, authorId: userId },
    include: { author: true },
  })

  // Revalidate the track page so avg/header and first page update
  revalidatePath(`/track/${trackId}`)

  return NextResponse.json({ review })
}
