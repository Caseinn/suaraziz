// components/home/Hero.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Hero({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <section className="relative py-16 px-4 text-center">
      {/* Subtle gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-80 bg-gradient-to-r from-primary/10 via-blue-400/10 to-transparent blur-3xl"
      />

      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent relative">
        SuarAziz
      </h1>
      <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto relative">
        Discover, review, and share your favorite tracks with the community.
      </p>

      <form
        className="mt-8 max-w-xl mx-auto flex gap-2 relative"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        role="search"
        aria-label="Search tracks"
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for a song, artist, or vibe…"
          className="h-12 text-base"
          aria-label="Search query"
        />
        <Button
          type="submit"
          disabled={!value.trim() || loading}
          className="h-12 px-6 bg-primary hover:bg-primary/90"
          aria-busy={loading}
        >
          {loading ? "Searching…" : "Go"}
        </Button>
      </form>

      <p className="mt-3 text-xs text-muted-foreground relative">
        Tip: press <kbd className="px-1 py-0.5 border rounded">Enter</kbd> to search
      </p>
    </section>
  )
}
