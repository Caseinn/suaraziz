// app/api/featured-reviews/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
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
