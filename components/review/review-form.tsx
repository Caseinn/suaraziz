"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, LockKeyhole } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Props = Readonly<{
  trackId: string
  disabled?: boolean
  signInHref?: string
}>

const BODY_MAX = 800

export default function ReviewForm({
  trackId,
  disabled = false,
  signInHref = "/sign-in",
}: Props): React.ReactElement {
  const router = useRouter()

  const [rating, setRating] = React.useState<number>(0)
  const [hovered, setHovered] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState<string>("")
  const [body, setBody] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(false)

  // unique, stable ids (eslint a11y-friendly if multiple forms on page)
  const titleId = React.useId()
  const bodyId = React.useId()

  const canSubmit =
    !disabled &&
    !loading &&
    body.trim().length > 0 &&
    body.length <= BODY_MAX &&
    rating >= 1 &&
    rating <= 5

  const handleSubmit = React.useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault()
      if (!canSubmit) return
      setLoading(true)
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId, rating, title, body }),
        })
        if (!res.ok) {
          // try to surface server error message if present
          let msg = "Failed to post review"
          try {
            const j = (await res.json()) as { error?: string }
            if (j?.error) msg = j.error
          } catch {
            // ignore parse error
          }
          throw new Error(msg)
        }

        // created review from server
        const { review } = (await res.json()) as { review: unknown }
        // fire a typed-ish custom event (consumer will validate shape)
        window.dispatchEvent(new CustomEvent("review:created", { detail: review }))

        // reset form
        setTitle("")
        setBody("")
        setRating(0)

        toast.success("Review posted successfully")

        // refresh server data (avg + first page)
        router.refresh()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to post review"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [body, canSubmit, rating, router, title, trackId]
  )

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-4 rounded-2xl border p-4 bg-card/50")}
        aria-busy={loading}
      >
        <fieldset className="space-y-2" aria-disabled={disabled} disabled={disabled}>
          <legend className="text-sm font-medium">Your Rating</legend>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5">
            {[1, 2, 3, 4, 5].map((i) => {
              const active = (hovered ?? rating) >= i
              // stable callbacks to avoid re-renders; simple inline is fine too,
              // but these silence some perf/a11y linters in stricter configs
              const onEnter = () => !disabled && setHovered(i)
              const onLeave = () => !disabled && setHovered(null)
              const onClick = () => !disabled && setRating(i)

              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  onFocus={onEnter}
                  onBlur={onLeave}
                  onClick={onClick}
                  className={cn(
                    "p-1 rounded-md transition",
                    active ? "text-yellow-500" : "text-muted-foreground hover:text-foreground",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  tabIndex={disabled ? -1 : 0}
                >
                  <Star className={cn("h-6 w-6", active && "fill-current")} aria-hidden="true" />
                  <span className="sr-only">
                    {i} star{i > 1 ? "s" : ""}
                  </span>
                </button>
              )
            })}
            <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
              {rating}/5
            </span>
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor={titleId}>Title (optional)</Label>
          <Input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder='e.g., “Perfect for rainy days”'
            disabled={disabled || loading}
            inputMode="text"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={bodyId}>Your Review</Label>
          <Textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            placeholder="What did you think of this track?"
            className="min-h-32"
            disabled={disabled || loading}
            maxLength={BODY_MAX + 200}
          />
          <div
            className={cn(
              "text-xs",
              body.length > BODY_MAX ? "text-destructive" : "text-muted-foreground"
            )}
            aria-live="polite"
          >
            {body.length}/{BODY_MAX}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? "Posting..." : "Post Review"}
        </Button>
      </form>

      {disabled && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card">
              <LockKeyhole className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="max-w-[22rem] text-sm text-muted-foreground">
              Sign in to rate and write a review for this track.
            </p>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 cursor-pointer"
              onClick={() => {
                const callbackUrl = window.location.pathname
                window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
              }}
            >
              Sign in to review
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
