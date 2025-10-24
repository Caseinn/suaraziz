// components/home/FeaturedReviews.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stars } from "@/components/home/stars"
import { Heart } from "lucide-react"
import { useSession, signIn } from "next-auth/react"  
import type { FeaturedItem } from "./types"

type LikeState = { likes: number; liked: boolean }
type LikeMap = Record<string, LikeState>

export function FeaturedReviews() {
  const { status } = useSession()
  const isAuthed = status === "authenticated"

  const [items, setItems] = React.useState<FeaturedItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [likeMap, setLikeMap] = React.useState<LikeMap>({})

  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/featured-reviews", { cache: "no-store" })
        if (!r.ok) throw new Error("Failed to load featured")
        const json = await r.json()
        const top3: FeaturedItem[] = (json.items ?? []).slice(0, 3)
        setItems(top3)

        // Prefetch like counts
        const entries = await Promise.all(
          top3.map(async (it) => {
            try {
              const res = await fetch(`/api/reviews/${it.id}/like`, { cache: "no-store" })
              if (!res.ok) throw new Error()
              const data = (await res.json()) as Partial<LikeState>
              return [it.id, { likes: data.likes ?? 0, liked: !!data.liked }] as const
            } catch {
              return [it.id, { likes: 0, liked: false }] as const
            }
          })
        )
        setLikeMap(Object.fromEntries(entries))
      } catch {
        setError("Couldn’t load featured reviews right now.")
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleLike = React.useCallback(async (reviewId: string) => {
    if (!isAuthed) {
      signIn()
      return
    }

    setLikeMap((prev) => {
      const cur = prev[reviewId] ?? { likes: 0, liked: false }
      const next = {
        liked: !cur.liked,
        likes: cur.liked ? Math.max(0, cur.likes - 1) : cur.likes + 1,
      }
      return { ...prev, [reviewId]: next }
    })

    try {
      const r = await fetch(`/api/reviews/${reviewId}/like`, { method: "POST" })
      if (!r.ok) throw new Error()
      const data = (await r.json()) as LikeState
      setLikeMap((prev) => ({ ...prev, [reviewId]: data }))
    } catch {
      setLikeMap((prev) => {
        const cur = prev[reviewId] ?? { likes: 0, liked: false }
        const revert = {
          liked: !cur.liked,
          likes: cur.liked ? cur.likes + 1 : Math.max(0, cur.likes - 1),
        }
        return { ...prev, [reviewId]: revert }
      })
    }
  }, [isAuthed]) 

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
              <div key={i} className="rounded-2xl border p-4 animate-pulse space-y-3">
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

        {/* Success */}
        {!loading && items && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => {
              const ls = likeMap[item.id] ?? { likes: 0, liked: false }
              return (
                <Link
                  key={item.id}
                  href={`/track/${item.track.id}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl transition"
                >
                  <Card className="relative rounded-2xl border border-border/40 hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      {/* Header */}
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
                            <div className="text-sm font-medium">{item.author.name}</div>
                            <time
                              dateTime={new Date(item.createdAt).toISOString()}
                              className="text-[11px] text-muted-foreground"
                            >
                              {new Date(item.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Stars value={item.rating} />
                            <span className="text-muted-foreground">{item.rating}/5</span>
                          </div>

                          {/* Like button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-pressed={ls.liked}
                            aria-disabled={!isAuthed}
                            disabled={!isAuthed}                        
                            title={isAuthed ? "Like" : "Sign in to like"}  
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleLike(item.id)
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 transition-colors ${
                                ls.liked ? "fill-current text-red-500" : ""
                              }`}
                            />
                            <span className="ml-1 text-xs">{ls.likes}</span>
                          </Button>
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
                            <div className="text-sm font-medium leading-tight">{item.title}</div>
                          )}
                          {item.body && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {item.body}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    {/* Overlay fixed */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
