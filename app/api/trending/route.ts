// app/api/trending/route.ts
import { NextResponse } from "next/server"
import * as cheerio from "cheerio"
import { prisma } from "@/lib/prisma"
import { getRedis } from "@/lib/redis"
import { getRequestIp, rateLimit } from "@/lib/security"

const KWORB_URL = "https://kworb.net/spotify/country/global_weekly.html"
const KWORB_ROWS = 10
const RESULT_LIMIT = 8
const KWORB_REVALIDATE_SECONDS = 60 * 60
const TRENDING_CACHE_KEY = "trending:items"
const TRENDING_CACHE_TTL_SECONDS = 24 * 60 * 60
const SEARCH_CACHE_TTL_SECONDS = 48 * 60 * 60
const SEARCH_MISS_TTL_SECONDS = 6 * 60 * 60
const KWORB_TIMEOUT_MS = 10_000
const SPOTIFY_TIMEOUT_MS = 8_000

type Item = {
  id: string
  name: string
  artists: string[]
  album: string
  image?: string
}

type KworbRow = { title: string; artist: string }

type SpotifyImage = { url: string; height: number | null; width: number | null }
type SpotifyArtist = { id: string; name: string }
type SpotifyAlbum = { name: string; images?: SpotifyImage[] }
type SpotifyTrack = {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  preview_url?: string | null
  popularity?: number | null
}
type SpotifySearchResponse = { tracks?: { items: SpotifyTrack[] } }

type FetchOptions = RequestInit & { next?: { revalidate?: number } }
type TrackExtras = { previewUrl?: string | null; popularity?: number | null }
type CachedSearch = Item | { miss: true }

const SPOTIFY_TOKEN_KEY = "spotify:app_token"
const SPOTIFY_SEARCH_PREFIX = "spotify:search:"

async function fetchWithTimeout(
  url: string,
  options: FetchOptions,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function getAppToken(force = false): Promise<string> {
  const redis = getRedis()
  if (!force && redis) {
    const cached = await redis.get<string>(SPOTIFY_TOKEN_KEY)
    if (cached) return cached
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID ?? ""
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? ""
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetchWithTimeout(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
    SPOTIFY_TIMEOUT_MS
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`spotify token error (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error("spotify token missing in response")
  const expiresIn = Number(json.expires_in ?? 3600)
  if (redis) {
    const ttlSeconds = Math.max(60, Math.floor(expiresIn - 60))
    await redis.set(SPOTIFY_TOKEN_KEY, json.access_token, { ex: ttlSeconds })
  }
  return json.access_token
}

function cacheKeyForQuery(query: string) {
  return `${SPOTIFY_SEARCH_PREFIX}${encodeURIComponent(query)}`
}

async function getCachedSearch(query: string): Promise<CachedSearch | null> {
  const redis = getRedis()
  if (!redis) return null
  const raw = await redis.get<string>(cacheKeyForQuery(query))
  if (!raw) return null
  try {
    return JSON.parse(raw) as CachedSearch
  } catch {
    return null
  }
}

async function setCachedSearch(query: string, item: Item) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(cacheKeyForQuery(query), JSON.stringify(item), {
    ex: SEARCH_CACHE_TTL_SECONDS,
  })
}

async function setCachedMiss(query: string) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(cacheKeyForQuery(query), JSON.stringify({ miss: true }), {
    ex: SEARCH_MISS_TTL_SECONDS,
  })
}

async function upsertTrackFromItem(item: Item, extras?: TrackExtras) {
  const extraData = {
    ...(typeof extras?.previewUrl !== "undefined"
      ? { previewUrl: extras.previewUrl ?? null }
      : {}),
    ...(typeof extras?.popularity !== "undefined"
      ? { popularity: extras.popularity ?? null }
      : {}),
  }

  try {
    await prisma.track.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        artists: item.artists,
        album: item.album,
        albumImage: item.image ?? null,
        cachedAt: new Date(),
        ...extraData,
      },
      update: {
        name: item.name,
        artists: item.artists,
        album: item.album,
        albumImage: item.image ?? null,
        cachedAt: new Date(),
        ...extraData,
      },
    })
  } catch {
    // ignore catalog cache errors to keep trending responsive
  }
}

async function searchSpotifyTrack(query: string): Promise<Item | null> {
  const cached = await getCachedSearch(query)
  if (cached) {
    if ("miss" in cached) return null
    await upsertTrackFromItem(cached)
    return cached
  }

  let token = await getAppToken()
  const url = `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(query)}`
  let res = await fetchWithTimeout(
    url,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    SPOTIFY_TIMEOUT_MS
  )

  if (res.status === 401) {
    token = await getAppToken(true)
    res = await fetchWithTimeout(
      url,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      SPOTIFY_TIMEOUT_MS
    )
  }

  if (!res.ok) return null
  const data = (await res.json()) as SpotifySearchResponse
  const track = data.tracks?.items?.[0]
  if (!track) {
    await setCachedMiss(query)
    return null
  }

  const item: Item = {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    album: track.album?.name ?? "",
    image: track.album?.images?.[0]?.url,
  }

  await upsertTrackFromItem(item, {
    previewUrl: track.preview_url ?? null,
    popularity: track.popularity ?? null,
  })
  await setCachedSearch(query, item)
  return item
}

async function fetchKworbRows(): Promise<KworbRow[]> {
  const res = await fetchWithTimeout(
    KWORB_URL,
    {
      headers: { "User-Agent": "SuarAzizBot/1.0" },
      next: { revalidate: KWORB_REVALIDATE_SECONDS },
    },
    KWORB_TIMEOUT_MS
  )

  if (!res.ok) {
    throw new Error(`kworb fetch failed (${res.status})`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)
  const rows = $("#spotifyweekly tbody tr").slice(0, KWORB_ROWS)
  const results: KworbRow[] = []

  rows.each((_, row) => {
    const cell = $(row).find("td").eq(2)
    const links = cell.find("a")
    const artist = links.first().text().trim()
    const title = links.eq(1).text().trim() || links.last().text().trim()
    if (!title) return
    results.push({ title, artist })
  })

  return results
}

async function getFallbackTrending(): Promise<Item[]> {
  const tracks = await prisma.track.findMany({
    where: {
      popularity: { not: null },
      cachedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: [{ popularity: "desc" }, { cachedAt: "desc" }],
    take: RESULT_LIMIT,
  })

  return tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists,
    album: t.album,
    image: t.albumImage ?? undefined,
  }))
}

async function buildTrendingFromKworb(rows: KworbRow[]): Promise<Item[]> {
  const items: Item[] = []
  for (const row of rows) {
    if (items.length >= RESULT_LIMIT) break
    if (!row.title) continue
    const query = row.artist
      ? `track:"${row.title}" artist:"${row.artist}"`
      : `track:"${row.title}"`
    const item = await searchSpotifyTrack(query)
    if (item && !items.some((existing) => existing.id === item.id)) {
      items.push(item)
    }
  }
  return items
}

export async function GET(req: Request) {
  const ip = getRequestIp(req)
  const key = ip === "unknown" ? "unknown" : ip
  const { success, reset } = await rateLimit(`trending:get:${key}`, { limit: 60, windowMs: 60_000 })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const redis = getRedis()
  if (redis) {
    const cached = await redis.get<string>(TRENDING_CACHE_KEY)
    if (cached) {
      try {
        const items = JSON.parse(cached) as Item[]
        if (Array.isArray(items) && items.length > 0) {
          return NextResponse.json({ items })
        }
      } catch {
        // ignore cache parse errors
      }
    }
  }

  try {
    const kworbRows = await fetchKworbRows()
    const items = await buildTrendingFromKworb(kworbRows)

    if (items.length < RESULT_LIMIT) {
      const fallback = await getFallbackTrending()
      for (const item of fallback) {
        if (items.length >= RESULT_LIMIT) break
        if (!items.some((existing) => existing.id === item.id)) {
          items.push(item)
        }
      }
    }

    if (items.length > 0) {
      if (redis) {
        await redis.set(TRENDING_CACHE_KEY, JSON.stringify(items), {
          ex: TRENDING_CACHE_TTL_SECONDS,
        })
      }
      return NextResponse.json({ items })
    }

    const fallback = await getFallbackTrending()
    if (redis && fallback.length > 0) {
      await redis.set(TRENDING_CACHE_KEY, JSON.stringify(fallback), {
        ex: TRENDING_CACHE_TTL_SECONDS,
      })
    }
    return NextResponse.json({ items: fallback })
  } catch (err) {
    console.error("Trending fetch error:", err)
    try {
      const fallback = await getFallbackTrending()
      if (redis && fallback.length > 0) {
        await redis.set(TRENDING_CACHE_KEY, JSON.stringify(fallback), {
          ex: TRENDING_CACHE_TTL_SECONDS,
        })
      }
      return NextResponse.json({ items: fallback })
    } catch (fallbackErr) {
      console.error("Trending fallback error:", fallbackErr)
      return NextResponse.json({ items: [] }, { status: 500 })
    }
  }
}
