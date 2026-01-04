// components/home/featured-review.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GrooveBars } from "@/components/ui/groove"
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
        setError("Could not load featured reviews right now.")
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleLike = React.useCallback(
    async (reviewId: string) => {
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
    },
    [isAuthed]
  )

  const lead = items?.[0] ?? null
  const rest = items?.slice(1) ?? []

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Featured reviews
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl font-display">Reviews with gravity</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            The strongest reflections from the community archive.
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Top 3
        </span>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-5 sm:p-6 animate-pulse">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-6 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/70 bg-card/70 p-4 animate-pulse">
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="mt-3 h-3 w-2/3 bg-muted rounded" />
                <div className="mt-3 h-10 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (!items || items.length === 0 || error) && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground text-center">
            {error ?? "No featured reviews yet."}
          </CardContent>
        </Card>
      )}

      {!loading && lead && (
        <div className="space-y-5">
          <Link
            href={`/track/${lead.track.id}`}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl transition"
          >
            <Card className="relative overflow-hidden border border-border/70 bg-card/90">
              {lead.track.image && (
                <div className="pointer-events-none absolute inset-0">
                  <Image
                    src={lead.track.image}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover opacity-15 blur-2xl scale-105"
                  />
                </div>
              )}
              <CardContent className="relative p-5 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 overflow-hidden rounded-2xl border border-border/70">
                    {lead.track.image ? (
                      <Image
                        src={lead.track.image}
                        alt={lead.track.name}
                        width={176}
                        height={176}
                        loading="lazy"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {lead.author.image ? (
                          <Image
                            src={lead.author.image}
                            alt={lead.author.name}
                            width={36}
                            height={36}
                            loading="lazy"
                            className="w-9 h-9 rounded-full object-cover border border-border/70"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {(lead.author.name?.[0] ?? "U").toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{lead.author.name}</div>
                          <time
                            dateTime={new Date(lead.createdAt).toISOString()}
                            className="text-[11px] text-muted-foreground"
                          >
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 rounded-full shrink-0"
                        aria-pressed={(likeMap[lead.id] ?? { liked: false }).liked}
                        aria-disabled={!isAuthed}
                        disabled={!isAuthed}
                        title={isAuthed ? "Like" : "Sign in to like"}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleLike(lead.id)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            (likeMap[lead.id] ?? { liked: false }).liked
                              ? "fill-current text-red-500"
                              : ""
                          }`}
                        />
                        <span className="ml-1 text-xs">
                          {(likeMap[lead.id] ?? { likes: 0 }).likes}
                        </span>
                      </Button>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                        Featured entry
                      </p>
                      <h3 className="mt-2 text-xl sm:text-2xl font-display leading-tight truncate">
                        {lead.track.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {lead.track.artists.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <GrooveBars value={lead.rating} />
                      <span className="text-muted-foreground">{lead.rating}/5</span>
                    </div>

                    {lead.title && (
                      <div className="text-sm sm:text-base font-medium leading-tight">
                        {lead.title}
                      </div>
                    )}
                    {lead.body && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {lead.body}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {rest.map((item) => {
                const ls = likeMap[item.id] ?? { likes: 0, liked: false }
                return (
                  <Link
                    key={item.id}
                    href={`/track/${item.track.id}`}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl transition"
                  >
                    <Card className="relative overflow-hidden border border-border/70 bg-card/90">
                      <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          {item.track.image ? (
                            <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-xl border border-border/70">
                              <Image
                                src={item.track.image}
                                alt={item.track.name}
                                width={56}
                                height={56}
                                loading="lazy"
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 shrink-0 rounded-xl border border-border/70 bg-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {item.track.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.track.artists.join(", ")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <GrooveBars value={item.rating} size="sm" />
                            <span className="text-muted-foreground">{item.rating}/5</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 rounded-full"
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

                        {item.title && (
                          <div className="text-sm font-medium leading-tight">{item.title}</div>
                        )}
                        {item.body && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {item.body}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
