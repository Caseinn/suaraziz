// app/api/search/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// --- Minimal Spotify types (only what we actually use) ---
type SpotifyImage = { url: string; height: number | null; width: number | null }
type SpotifyArtist = { id: string; name: string }
type SpotifyAlbum = { name: string; images?: SpotifyImage[] }
type SpotifyTrack = {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  preview_url: string | null
  popularity: number | null
}
type SpotifySearchResponse = {
  tracks?: { items: SpotifyTrack[] }
}

async function getAppToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? ""
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? ""
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`spotify token error (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error("spotify token missing in response")
  return json.access_token
}

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim()
  if (!q) return NextResponse.json({ items: [] })

  // 1) Try cache first (7 days), with OR across name/album/artists
  const existingTracks = await prisma.track.findMany({
    where: {
      cachedAt: { gte: new Date(Date.now() - CACHE_MAX_AGE_MS) },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { album: { contains: q, mode: "insensitive" } },
        { artists: { has: q } },
      ],
    },
    take: 10,
    select: {
      id: true,
      name: true,
      artists: true,
      album: true,
      albumImage: true,
    },
  })

  if (existingTracks.length > 0) {
    return NextResponse.json({
      items: existingTracks.map((t) => ({
        id: t.id,
        name: t.name,
        artists: t.artists,
        album: t.album,
        image: t.albumImage ?? undefined,
      })),
    })
  }

  // 2) Fallback to Spotify
  const token = await getAppToken()
  const r = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!r.ok) {
    const text = await r.text().catch(() => "")
    return NextResponse.json(
      { error: "spotify search failed", details: text },
      { status: 502 }
    )
  }

  const data = (await r.json()) as SpotifySearchResponse
  const tracks: SpotifyTrack[] = data.tracks?.items ?? []

  // 3) Cache results (upsert)
  await Promise.all(
    tracks.map((t) =>
      prisma.track.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          name: t.name,
          artists: t.artists.map((a) => a.name),
          album: t.album.name,
          albumImage: t.album.images?.[0]?.url ?? null,
          previewUrl: t.preview_url ?? null,
          popularity: t.popularity ?? null,
          cachedAt: new Date(),
        },
        update: {
          name: t.name,
          artists: t.artists.map((a) => a.name),
          album: t.album.name,
          albumImage: t.album.images?.[0]?.url ?? null,
          previewUrl: t.preview_url ?? null,
          popularity: t.popularity ?? null,
          cachedAt: new Date(),
        },
      })
    )
  )

  // 4) Public response
  return NextResponse.json({
    items: tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      album: t.album?.name,
      image: t.album?.images?.[0]?.url,
    })),
  })
}
