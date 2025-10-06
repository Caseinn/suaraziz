// components/home/HomeScreen.tsx
"use client"

import * as React from "react"
import { Hero } from "@/components/home/hero"
import { Trending } from "@/components/home/trending"
import { FeaturedReviews } from "@/components/home/featured-review"
import { Results } from "@/components/home/results"
import type { Item } from "@/components/home/types"

export function HomeScreen() {
  const [q, setQ] = React.useState("")
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const resultRef = React.useRef<HTMLDivElement | null>(null)

  async function search() {
    const query = q.trim()
    if (!query) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!r.ok) throw new Error("Search failed")
      const json = await r.json()
      setItems(json.items)
      // Smooth-scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 120)
    } catch {
      setError("Something went wrong. Please try again.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-16 relative">
      <Hero value={q} onChange={setQ} onSubmit={search} loading={loading} />
      <Trending />
      <FeaturedReviews />
      <Results items={items} error={error} anchorRef={resultRef} />
    </div>
  )
}
