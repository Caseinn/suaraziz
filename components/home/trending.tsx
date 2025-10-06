// components/home/Trending.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Item } from "./types"
import Image from "next/image"

export function Trending() {
  const [items, setItems] = React.useState<Item[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/trending", { cache: "no-store" })
        if (!r.ok) throw new Error("Failed to load trending")
        const json = await r.json()
        setItems(json.items ?? [])
      } catch {
        setError("Couldn’t load trending right now.")
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Trending now</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-3 animate-pulse space-y-3">
                <div className="w-full aspect-square rounded-lg bg-muted" />
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
          </Card>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((t, idx) => (
              <Card
                key={t.id}
                className="group relative overflow-hidden rounded-xl border hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/track/${t.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={`Open ${t.name} by ${t.artists.join(", ")}`}
                />

                <CardContent className="p-3">
                  <div className="relative overflow-hidden rounded-lg">
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={t.name}
                        width={500}
                        height={500}
                        className="w-full aspect-square object-cover border rounded-lg transition-transform duration-300 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-muted border" />
                    )}

                    {/* Rank badge */}
                    <span className="absolute top-2 left-2 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[11px] border text-muted-foreground">
                      #{idx + 1}
                    </span>

                    {/* Light gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-background/40 to-transparent" />
                  </div>

                  <div className="mt-3">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.artists.join(", ")}
                    </div>
                  </div>
                </CardContent>

                {/* Keyboard focus ring */}
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-offset-1 ring-offset-background group-focus-within:ring-2 ring-ring" />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No trending tracks yet. Try searching to seed your cache.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
