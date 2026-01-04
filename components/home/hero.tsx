// components/home/hero.tsx
"use client"

import Link from "next/link"

export function Hero() {
  return (
    <section id="write" className="relative">
      <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
        <div className="space-y-5 sm:space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95]">
            SuarAziz
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl">
            An archival journal documenting how songs are heard, remembered, and revisited
            over time.
          </p>

          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Each entry focuses on listening notes and personal context rather than popularity
            or performance.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>Use the header to search</span>
            <span className="hidden sm:inline">Field notes first</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              Listening protocol
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display leading-tight">
              Write. Rate. Reflect.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every entry becomes part of the shared archive.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/60 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              Curator&apos;s note
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              We do not count plays. We collect thoughts, timestamps, and the reason a track
              stays with you.
            </p>
          </div>

          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full border border-border/70 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-foreground hover:border-primary/60 hover:text-primary transition"
          >
            Open the index
          </Link>
        </div>
      </div>
    </section>
  )
}
