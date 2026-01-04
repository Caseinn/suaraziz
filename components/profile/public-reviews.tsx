// components/profile/public-reviews.tsx
"use client"
import Link from "next/link"
import Image from "next/image"
import { GrooveBars } from "@/components/ui/groove"

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
      <div className="rounded-2xl border border-border/70 bg-card/70 p-5 sm:p-6 text-sm text-muted-foreground">
        No reviews yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {initialItems.map((r) => {
        const createdIso = new Date(r.createdAt).toISOString()
        const t = r.track

        return (
          <article
            key={r.id}
            className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5 transition-all"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {t?.albumImage ? (
                <Link href={`/track/${t.id}`} className="shrink-0">
                  <Image
                    src={t.albumImage}
                    alt={t.name || "Album art"}
                    width={56}
                    height={56}
                    loading="lazy"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-border/70"
                  />
                </Link>
              ) : null}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <Link
                    href={`/track/${t?.id}`}
                    className="font-medium hover:text-primary transition-colors truncate"
                  >
                    {t?.name ?? "Unknown track"}
                  </Link>
                  {t?.artists?.length ? (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {t.artists.join(", ")}
                      </span>
                    </>
                  ) : null}
                  <span className="text-muted-foreground">/</span>
                  <time dateTime={createdIso} className="text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </time>
                </div>

                <div className="mt-2 text-xs sm:text-sm flex items-center gap-2">
                  <GrooveBars value={r.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">{r.rating}/5</span>
                  {r.title ? <span className="text-sm">- {r.title}</span> : null}
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
