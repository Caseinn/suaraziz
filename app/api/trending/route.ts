// app/api/trending/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rows = await prisma.track.findMany({
      where: { popularity: { not: null } },
      orderBy: [{ popularity: "desc" }, { cachedAt: "desc" }],
      take: 8,
    })

    const data = {
      items: rows.map(t => ({
        id: t.id,
        name: t.name,
        artists: t.artists,
        album: t.album,
        image: t.albumImage ?? undefined,
      })),
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("trending fetch error", err)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}