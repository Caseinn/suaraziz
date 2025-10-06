// app/api/trending/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

const CACHE_PATH = path.join(process.cwd(), "tmp", "trending.json")
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h

export async function GET() {
  try {
    // try read cache first
    const stat = await fs.stat(CACHE_PATH).catch(() => null)
    if (stat && Date.now() - stat.mtimeMs < CACHE_TTL) {
      const cached = JSON.parse(await fs.readFile(CACHE_PATH, "utf8"))
      return NextResponse.json(cached)
    }

    // rebuild cache
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
      cachedAt: new Date().toISOString(),
    }

    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true })
    await fs.writeFile(CACHE_PATH, JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (err) {
    console.error("trending cache error", err)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
