// components/home/results.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Item } from "./types"

export function Results({
  items,
  error,
  anchorRef,
}: {
  items: Item[]
  error: string | null
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <section id="archive" ref={anchorRef} className="space-y-5 sm:space-y-6">
      {error && (
        <Card>
          <CardContent className="p-5 text-sm text-destructive text-center">
            {error}
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Archive
              </p>
              <h2 className="mt-2 text-xl sm:text-2xl font-display">Search results</h2>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "entry" : "entries"} found
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Indexed
            </span>
          </div>

          <ol className="space-y-4 border-l border-border/70 pl-4 sm:pl-6">
            {items.map((t, idx) => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[7px] sm:-left-[9px] top-6 h-2.5 w-2.5 rounded-full bg-primary/80" />
                <Link
                  href={`/track/${t.id}`}
                  className="group block rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5 hover:border-primary/60 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {t.image ? (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-border/70 shrink-0">
                        <Image
                          src={t.image}
                          alt={t.name}
                          width={56}
                          height={56}
                          loading="lazy"
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-muted border border-border/70 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {t.artists.join(", ")}
                        {t.album ? ` - ${t.album}` : ""}
                      </p>
                    </div>

                    <span className="hidden sm:inline text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Open
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
