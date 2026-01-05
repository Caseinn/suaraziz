// app/api/featured-reviews/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestIp, rateLimit } from "@/lib/security"

export async function GET(req: Request) {
  const ip = getRequestIp(req)
  const key = ip === "unknown" ? "unknown" : ip
  const { success, reset } = await rateLimit(`featured:get:${key}`, { limit: 60, windowMs: 60_000 })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }
  // Fetch recent reviews with rating > 0
  const reviews = await prisma.review.findMany({
    where: { rating: { gt: 0 } },
    include: {
      author: { select: { id: true, name: true, image: true } },
      track: { select: { id: true, name: true, artists: true, album: true, albumImage: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20, // pick more than 3 to randomize from
  })

  // Shuffle and pick only 3
  const random = reviews.sort(() => Math.random() - 0.5).slice(0, 3)

  return NextResponse.json({
    items: random.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      author: r.author,
      track: {
        id: r.track.id,
        name: r.track.name,
        artists: r.track.artists,
        album: r.track.album,
        image: r.track.albumImage ?? undefined,
      },
    })),
  })
}
