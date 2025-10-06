import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/requireUser"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const trackId = url.searchParams.get("trackId")
  const limitParam = url.searchParams.get("limit")
  const cursorId = url.searchParams.get("cursor")

  if (!trackId) return NextResponse.json({ items: [], avg: null, nextCursor: null })

  const limit = Math.max(1, Math.min(Number(limitParam) || 10, 50)) // safe bounds
  const take = limit + 1 // fetch one extra to check if more pages exist

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

  // Derive nextCursor
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
  if (!trackId || !rating || !body) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  await prisma.track.upsert({
    where: { id: trackId },
    create: { id: trackId, name: "Unknown", artists: [], album: "" },
    update: {},
  })

  const review = await prisma.review.create({
    data: { trackId, rating: Number(rating), title: title ?? null, body, authorId: userId },
    include: { author: true },
  })

  return NextResponse.json({ review })
}

