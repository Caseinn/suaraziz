// app/api/search/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestIp, rateLimit } from "@/lib/security"

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
  tracks?: { items: SpotifyTrack[]; total?: number }
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

export async function GET(req: Request) {
  const ip = getRequestIp(req)
  if (ip !== "unknown") {
    const { success, reset } = await rateLimit(`search:${ip}`, { limit: 30, windowMs: 60_000 })
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim()
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "10", 10)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10
  const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const offset = (page - 1) * limit
  if (!q) return NextResponse.json({ items: [], total: 0, page, limit })

  // Always query Spotify to avoid cached/stale results.
  const token = await getAppToken()
  const r = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=${limit}&offset=${offset}&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )

  if (!r.ok) {
    return NextResponse.json({ error: "spotify search failed" }, { status: 502 })
  }

  const data = (await r.json()) as SpotifySearchResponse
  const tracks: SpotifyTrack[] = data.tracks?.items ?? []
  const total = data.tracks?.total ?? tracks.length

  // Update the local catalog so track pages have metadata.
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
    total,
    page,
    limit,
  })
}
