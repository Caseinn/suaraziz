// components/home/results.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Item } from "./types"
import Image from "next/image"

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
    <div ref={anchorRef}>
      {error && (
        <div className="px-4">
          <div className="max-w-4xl mx-auto mb-4 text-center text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <section className="px-4 pb-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">Results</h2>
          <ul className="space-y-4 max-w-4xl mx-auto">
            {items.map((t) => (
              <Link
                key={t.id}
                href={`/track/${t.id}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl transition"
              >
                <Card className="relative overflow-hidden border border-border/40 hover:shadow-md hover:border-primary/40 transition-all duration-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    {t.image ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border shrink-0">
                        <Image
                          src={t.image}
                          alt={t.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted border shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {t.artists.join(", ")} — {t.album}
                      </p>
                    </div>

                    {/* Right arrow hint on hover */}
                    <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">→</span>
                    </div>
                  </CardContent>

                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </Link>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
