// components/review/review-list.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ReviewCard } from "@/components/review/review-card"
import { Comments } from "@/components/review/comments"
import { GrooveRatingInput } from "@/components/ui/groove-rating-input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Author = {
  id: string
  displayName?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
}

export type Review = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string | Date
  authorId: string
  author: Author
  trackId: string
}

type LikeState = { likes: number; liked: boolean }
type LikeMap = Record<string, LikeState>

const BODY_MAX = 800

export default function ReviewsList({
  trackId,
  initialItems,
  initialNextCursor,
  pageSize = 10,
  currentUserId,
}: {
  trackId: string
  initialItems: Review[]
  initialNextCursor: string | null
  pageSize?: number
  currentUserId: string | null
}) {
  const router = useRouter()
  const [items, setItems] = React.useState<Review[]>(
    initialItems.map((r) => ({ ...r, createdAt: String(r.createdAt) }))
  )
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor)
  const [loading, setLoading] = React.useState(false)

  const isAuthed = !!currentUserId

  const [likeMap, setLikeMap] = React.useState<LikeMap>({})
  const [likesBootstrapped, setLikesBootstrapped] = React.useState(false)

  React.useEffect(() => {
    const normalized = initialItems.map((r) => ({ ...r, createdAt: String(r.createdAt) }))
    setItems(normalized)
    setNextCursor(initialNextCursor)
    setLikesBootstrapped(false)
  }, [initialItems, initialNextCursor])

  const fetchLikeForIds = React.useCallback(async (ids: string[]) => {
    if (!ids.length) return
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/reviews/${id}/like`, { cache: "no-store" })
          const data = (await res.json()) as Partial<LikeState>
          return [id, { likes: data.likes ?? 0, liked: !!data.liked }] as const
        } catch {
          return [id, { likes: 0, liked: false }] as const
        }
      })
    )
    setLikeMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
  }, [])

  React.useEffect(() => {
    if (likesBootstrapped) return
    const ids = items.map((r) => r.id)
    ;(async () => {
      await fetchLikeForIds(ids)
      setLikesBootstrapped(true)
    })()
  }, [items, likesBootstrapped, fetchLikeForIds])

  React.useEffect(() => {
    const onCreated = (e: Event) => {
      const ce = e as CustomEvent<Review>
      const review = ce.detail
      if (!review || review.trackId !== trackId) return
      ;(async () => {
        await fetchLikeForIds([review.id])
        setItems((prev) => {
          if (prev.some((x) => x.id === review.id)) return prev
          const normalized = { ...review, createdAt: String(review.createdAt) }
          return [normalized, ...prev]
        })
      })()
    }
    window.addEventListener("review:created", onCreated as EventListener)
    return () => window.removeEventListener("review:created", onCreated as EventListener)
  }, [trackId, fetchLikeForIds])

  const toggleLike = async (reviewId: string) => {
    if (!isAuthed) {
      const callbackUrl = window.location.pathname
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
      return
    }

    const cur = likeMap[reviewId] ?? { likes: 0, liked: false }
    setLikeMap((prev) => ({
      ...prev,
      [reviewId]: { liked: !cur.liked, likes: cur.liked ? Math.max(0, cur.likes - 1) : cur.likes + 1 },
    }))

    try {
      const r = await fetch(`/api/reviews/${reviewId}/like`, { method: "POST" })
      if (!r.ok) throw new Error()
      const data = (await r.json()) as LikeState
      setLikeMap((prev) => ({ ...prev, [reviewId]: data }))
    } catch {
      setLikeMap((prev) => ({ ...prev, [reviewId]: cur }))
      toast.error("Failed to update like")
    }
  }

  const loadMore = async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const qs = new URLSearchParams({ trackId, limit: String(pageSize), cursor: nextCursor })
      const res = await fetch(`/api/reviews?${qs}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load more")
      const json = (await res.json()) as { items: Review[]; nextCursor: string | null }
      const newOnes = json.items.map((r) => ({ ...r, createdAt: String(r.createdAt) }))
      await fetchLikeForIds(newOnes.map((r) => r.id))
      setItems((prev) => [...prev, ...newOnes])
      setNextCursor(json.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  const [editing, setEditing] = React.useState<Review | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editBody, setEditBody] = React.useState("")
  const [editRating, setEditRating] = React.useState(0)
  const [saving, setSaving] = React.useState(false)

  const startEdit = (r: Review) => setEditing(r)
  const closeEdit = () => setEditing(null)

  React.useEffect(() => {
    if (!editing) return
    setEditTitle(editing.title ?? "")
    setEditBody(editing.body)
    setEditRating(editing.rating)
  }, [editing])

  const saveEdit = async () => {
    if (!editing) return
    if (!editBody.trim() || editBody.length > BODY_MAX || editRating < 1 || editRating > 5) return
    try {
      setSaving(true)
      const payload = { title: editTitle, body: editBody, rating: editRating }
      const res = await fetch(`/api/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const json = (await res.json()) as { review: Review }
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id ? { ...json.review, createdAt: String(json.review.createdAt) } : it
        )
      )
      toast.success("Review updated")
      setEditing(null)
      router.refresh()
    } catch {
      toast.error("Failed to update review")
    } finally {
      setSaving(false)
    }
  }

  const [deleting, setDeleting] = React.useState<Review | null>(null)
  const [deletingBusy, setDeletingBusy] = React.useState(false)

  const startDelete = (r: Review) => setDeleting(r)

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      setDeletingBusy(true)
      const res = await fetch(`/api/reviews/${deleting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((x) => x.id !== deleting.id))
      setLikeMap((prev) => {
        const copy = { ...prev }
        delete copy[deleting.id]
        return copy
      })
      toast.success("Review deleted")
      setDeleting(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete review")
    } finally {
      setDeletingBusy(false)
    }
  }

  if (!likesBootstrapped) {
    return (
      <section className="space-y-3">
        {items.slice(0, pageSize).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-muted rounded" />
                <div className="h-3 w-1/3 bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
              <div className="hidden sm:block h-8 w-14 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </section>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>
  }

  return (
    <>
      <section className="space-y-3">
        {items.map((r) => {
          const mine = !!currentUserId && r.authorId === currentUserId
          const like = likeMap[r.id] ?? { likes: 0, liked: false }
          return (
            <ReviewCard
              key={r.id}
              review={r}
              mine={mine}
              like={like}
              onToggleLike={() => toggleLike(r.id)}
              onEdit={startEdit}
              onDelete={startDelete}
            >
              <Comments reviewId={r.id} />
            </ReviewCard>
          )
        })}

        {nextCursor && (
          <div className="pt-2">
            <Button
              onClick={loadMore}
              disabled={loading}
              className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => (!o ? closeEdit() : null)}>
        <DialogContent key={editing?.id}>
          <DialogHeader>
            <DialogTitle>Edit review</DialogTitle>
          </DialogHeader>

          <GrooveRatingInput
            value={editRating}
            onChange={setEditRating}
            size="md"
            label="Edit rating"
          />

          <Input
            className="bg-input/40"
            placeholder="Title (optional)"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Textarea
            className="bg-input/40 min-h-24"
            placeholder="Your review"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => (!o ? setDeleting(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your review will be permanently removed.
              {deleting?.body ? (
                <span className="block mt-2 text-foreground italic">
                  &ldquo;
                  {deleting.body.length > 80 ? `${deleting.body.slice(0, 80)}...` : deleting.body}
                  &rdquo;
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingBusy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingBusy ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
