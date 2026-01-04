"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrooveRatingInput } from "@/components/ui/groove-rating-input"
import { LockKeyhole } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Props = Readonly<{
  trackId: string
  disabled?: boolean
  signInHref?: string
  lockReason?: "auth" | "existing" | null
}>

const BODY_MAX = 800

export default function ReviewForm({
  trackId,
  disabled = false,
  signInHref = "/sign-in",
  lockReason,
}: Props): React.ReactElement {
  const router = useRouter()

  const [rating, setRating] = React.useState<number>(0)
  const [title, setTitle] = React.useState<string>("")
  const [body, setBody] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(false)

  const titleId = React.useId()
  const bodyId = React.useId()

  const resolvedLock = lockReason ?? (disabled ? "auth" : null)
  const isLocked = !!resolvedLock

  const canSubmit =
    !isLocked &&
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
          let msg = "Failed to post review"
          try {
            const j = (await res.json()) as { error?: string }
            if (j?.error) msg = j.error
          } catch {
            // ignore parse error
          }
          throw new Error(msg)
        }

        const { review } = (await res.json()) as { review: unknown }
        window.dispatchEvent(new CustomEvent("review:created", { detail: review }))

        setTitle("")
        setBody("")
        setRating(0)

        toast.success("Review posted successfully")
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
        className={cn("space-y-4 sm:space-y-5 rounded-2xl border border-border/70 p-4 sm:p-5 bg-card/70")}
        aria-busy={loading}
      >
        <fieldset className="space-y-2 sm:space-y-3" aria-disabled={isLocked} disabled={isLocked}>
          <legend className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Your groove
          </legend>
          <GrooveRatingInput
            value={rating}
            onChange={setRating}
            disabled={disabled || loading}
            size="lg"
            label="Rating out of 5"
          />
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor={titleId}>Title (optional)</Label>
          <Input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Example: Perfect for rainy nights"
            disabled={disabled || loading}
            inputMode="text"
            autoComplete="off"
            className="bg-input/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={bodyId}>Your review</Label>
          <Textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            placeholder="What did you feel, notice, or question while listening?"
            className="min-h-32 bg-input/40"
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
          className="h-10 sm:h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
        >
          {loading ? "Posting..." : "Post review"}
        </Button>
      </form>

      {isLocked && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card">
              <LockKeyhole className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            {resolvedLock === "existing" ? (
              <p className="max-w-[22rem] text-sm text-muted-foreground px-2">
                You already reviewed this track. Edit your entry in the list below.
              </p>
            ) : (
              <>
                <p className="max-w-[22rem] text-sm text-muted-foreground">
                  Sign in to rate and write a review for this track.
                </p>
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  onClick={() => {
                    const callbackUrl = window.location.pathname
                    window.location.href = `${signInHref}?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  }}
                >
                  Sign in to review
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
