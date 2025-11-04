// app/api/trending/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      where: {
        popularity: { not: null },
        cachedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: [
        { popularity: "desc" },
        { cachedAt: "desc" } 
      ],
      take: 8,
    })

    const items = tracks.map(t => ({
      id: t.id,
      name: t.name,
      artists: t.artists,
      album: t.album,
      image: t.albumImage ?? undefined,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error("Trending fetch error:", err)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}