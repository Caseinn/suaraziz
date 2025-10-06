// components/profile/public-reviews.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Stars } from "@/components/home/stars"
import Image from "next/image"

type Author = {
  id: string
  displayName?: string | null
  name?: string | null
  image?: string | null
}

type Review = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string
  authorId: string
  author: Author
  trackId: string
  track?: {
    id: string
    name: string
    artists: string[]
    album?: string | null
    albumImage?: string | null
  }
}

export default function PublicReviews({ initialItems }: { initialItems: Review[] }) {
  if (!initialItems?.length) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
        No reviews yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {initialItems.map((r) => {
        const createdIso = new Date(r.createdAt).toISOString()
        const t = r.track // ✅ Removed `as any` — type is already defined

        return (
          <article key={r.id} className="rounded-2xl border p-4 bg-card/50 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              {/* Optional album art leading the row */}
              {t?.albumImage ? (
                <Link href={`/track/${t.id}`} className="shrink-0">
                  <Image
                    src={t.albumImage}
                    alt={t.name || "Album art"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                </Link>
              ) : null}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <Link href={`/track/${t?.id}`} className="font-medium hover:underline truncate">
                    {t?.name ?? "Unknown track"}
                  </Link>
                  {t?.artists?.length ? (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {t.artists.join(", ")}
                      </span>
                    </>
                  ) : null}
                  <span className="text-muted-foreground">•</span>
                  <time dateTime={createdIso} className="text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </time>
                </div>

                <div className="mt-1 text-sm flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{r.rating}/5</span>
                  {r.title ? <span className="text-sm">— {r.title}</span> : null}
                </div>

                {r.body && (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {r.body}
                  </p>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}