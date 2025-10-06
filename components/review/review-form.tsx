// components/review/review-form.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, LockKeyhole } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  trackId: string
  disabled?: boolean
  signInHref?: string // e.g. "/sign-in"
}

export default function ReviewForm({ trackId, disabled = false, signInHref = "/sign-in" }: Props) {
  const [rating, setRating] = React.useState<number>(0)
  const [hovered, setHovered] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const canSubmit = !disabled && body.trim().length > 0 && rating >= 1 && rating <= 5

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, rating, title, body }),
      })
      if (!r.ok) throw new Error("Failed")
      location.reload()
    } finally {
      setLoading(false)
    }
  }

  const formInner = (
    <>
      {/* Rating stars */}
      <fieldset className="space-y-2" aria-disabled={disabled}>
        <legend className="text-sm font-medium">Your Rating</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((i) => {
            const active = (hovered ?? rating) >= i
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                onMouseEnter={() => !disabled && setHovered(i)}
                onMouseLeave={() => !disabled && setHovered(null)}
                onFocus={() => !disabled && setHovered(i)}
                onBlur={() => !disabled && setHovered(null)}
                onClick={() => !disabled && setRating(i)}
                className={cn(
                  "p-1 rounded-md transition",
                  active ? "text-yellow-500" : "text-muted-foreground hover:text-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                tabIndex={disabled ? -1 : 0}
              >
                <Star className={cn("w-6 h-6", active && "fill-current")} />
                <span className="sr-only">{i} star{i > 1 ? "s" : ""}</span>
              </button>
            )
          })}
          <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., “Perfect for rainy days”"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Your Review</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you think of this track?"
          className="min-h-32"
          disabled={disabled}
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit || loading}
        className="bg-primary hover:bg-primary/90"
      >
        {loading ? "Posting..." : "Post Review"}
      </Button>
    </>
  )

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className={cn("space-y-4 rounded-2xl border p-4 bg-card/50")}>
        {formInner}
      </form>

      {disabled && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card">
              <LockKeyhole className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[22rem]">
              Sign in to rate and write a review for this track.
            </p>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link href={signInHref}>Sign in to review</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
