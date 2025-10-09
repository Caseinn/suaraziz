// components/home/FeaturedReviews.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Stars } from "@/components/home/stars"
import type { FeaturedItem } from "./types"
import Image from "next/image"

export function FeaturedReviews() {
  const [items, setItems] = React.useState<FeaturedItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/featured-reviews", { cache: "no-store" })
        if (!r.ok) throw new Error("Failed to load featured")
        const json = await r.json()
        setItems((json.items ?? []).slice(0, 3))
      } catch {
        setError("Couldn’t load featured reviews right now.")
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold">Featured Reviews</h2>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-4 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3 w-3/4 bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error or empty state */}
        {!loading && (!items || items.length === 0 || error) && (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground text-center">
              {error ?? "No featured reviews yet."}
            </CardContent>
          </Card>
        )}

        {/* Success — clickable cards */}
        {!loading && items && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/track/${item.track.id}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl transition"
              >
                <Card className="relative rounded-2xl border border-border/40 hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    {/* Header: author + rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.author.image ? (
                          <Image
                            src={item.author.image}
                            alt={item.author.name}
                            width={32}
                            height={32}
                            loading="lazy"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {(item.author.name?.[0] ?? "U").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {item.author.name}
                          </div>
                          <time
                            dateTime={new Date(item.createdAt).toISOString()}
                            className="text-[11px] text-muted-foreground"
                          >
                            {new Date(item.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <Stars value={item.rating} />
                        <span className="text-muted-foreground">
                          {item.rating}/5
                        </span>
                      </div>
                    </div>

                    {/* Track + review */}
                    <div className="flex items-start gap-4">
                      {item.track.image && (
                        <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={item.track.image}
                            alt={item.track.name}
                            width={80}
                            height={80}
                            loading="lazy"
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-1">
                          <div className="text-sm font-semibold leading-tight truncate">
                            {item.track.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.track.artists.join(", ")}
                          </div>
                        </div>

                        {item.title && (
                          <div className="text-sm font-medium leading-tight">
                            {item.title}
                          </div>
                        )}
                        {item.body && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {item.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Overlay effect for better click affordance */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
