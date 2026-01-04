// components/home/trending.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Item } from "./types"

const CLIENT_CACHE_KEY = "suaraziz:trending"
const CLIENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export function Trending() {
  const [items, setItems] = React.useState<Item[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let usedCache = false
    try {
      const raw = sessionStorage.getItem(CLIENT_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: Item[]; cachedAt?: number }
        const cachedItems = Array.isArray(parsed.items) ? parsed.items : null
        const cachedAt = typeof parsed.cachedAt === "number" ? parsed.cachedAt : 0
        if (
          cachedItems &&
          cachedItems.length > 0 &&
          Date.now() - cachedAt < CLIENT_CACHE_TTL_MS
        ) {
          setItems(cachedItems)
          setLoading(false)
          usedCache = true
        }
      }
    } catch {
      // ignore cache errors
    }

    if (usedCache) return

    ;(async () => {
      try {
        const r = await fetch("/api/trending", { cache: "no-store" })
        if (!r.ok) throw new Error("Failed to load trending")
        const json = await r.json()
        const nextItems = json.items ?? []
        setItems(nextItems)
        try {
          sessionStorage.setItem(
            CLIENT_CACHE_KEY,
            JSON.stringify({ items: nextItems, cachedAt: Date.now() })
          )
        } catch {
          // ignore cache write errors
        }
      } catch {
        setError("Could not load trending right now.")
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
          New arrivals
        </p>
        <h3 className="mt-2 text-lg sm:text-xl font-display">Trending shelf</h3>
        <p className="text-xs text-muted-foreground">
          The most replayed finds across the archive today.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card/70 p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      ) : items && items.length > 0 ? (
        <ol className="space-y-3">
          {items.map((t, idx) => (
            <li key={t.id}>
              <Link
                href={`/track/${t.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-3 sm:p-4 hover:border-primary/60 transition"
                aria-label={`Open ${t.name} by ${t.artists.join(", ")}`}
              >
                <span className="w-8 shrink-0 text-right tabular-nums text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/70">
                  {t.image ? (
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.artists.join(", ")}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No trending tracks yet. Search to seed your cache.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
