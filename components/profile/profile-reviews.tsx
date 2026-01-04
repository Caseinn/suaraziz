// app/profile/profile-reviews.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GrooveBars } from "@/components/ui/groove"
import { GrooveRatingInput } from "@/components/ui/groove-rating-input"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Track = {
  id: string
  name: string
  artists: string[]
  album: string | null
  albumImage: string | null
}

type Review = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string
  authorId: string
  trackId: string
  track?: Track | null
}

const BODY_MAX = 800

export default function ProfileReviews({ initialItems }: { initialItems: Review[] }) {
  const router = useRouter()
  const [items, setItems] = React.useState<Review[]>(initialItems)

  const [editing, setEditing] = React.useState<Review | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editBody, setEditBody] = React.useState("")
  const [editRating, setEditRating] = React.useState(0)
  const [saving, setSaving] = React.useState(false)

  const [deleting, setDeleting] = React.useState<Review | null>(null)
  const [deletingBusy, setDeletingBusy] = React.useState(false)

  const openEdit = (r: Review) => setEditing(r)

  React.useEffect(() => {
    if (!editing) return
    setEditTitle(editing.title ?? "")
    setEditBody(editing.body)
    setEditRating(editing.rating)
  }, [editing])

  const closeEdit = () => {
    if (saving) return
    setEditing(null)
    setEditTitle("")
    setEditBody("")
    setEditRating(0)
  }

  async function saveEdit() {
    if (!editing) return
    const bodyOk = !!editBody.trim() && editBody.length <= BODY_MAX
    const ratingOk = editRating >= 1 && editRating <= 5
    if (!bodyOk || !ratingOk) return

    try {
      setSaving(true)
      const payload = { title: editTitle, body: editBody, rating: editRating }
      const res = await fetch(`/api/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed")
      const json = (await res.json()) as { review: Review }
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id ? { ...json.review, createdAt: String(json.review.createdAt) } : it
        )
      )
      toast.success("Review updated")
      closeEdit()
      router.refresh()
    } catch {
      toast.error("Failed to update review")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      setDeletingBusy(true)
      const res = await fetch(`/api/reviews/${deleting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setItems((prev) => prev.filter((r) => r.id !== deleting.id))
      toast.success("Review deleted")
      setDeleting(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete review")
    } finally {
      setDeletingBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-border/70 bg-card/70">
        <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground">
          No reviews yet. Search a song on the homepage to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((r) => {
          const t = r.track
          const created = new Date(r.createdAt)
          const createdStr = created.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })

          return (
            <Card key={r.id} className="border-border/70 bg-card/70">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="shrink-0">
                    {t?.albumImage ? (
                      <Image
                        src={t.albumImage}
                        alt={t.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        sizes="(max-width: 640px) 48px, 64px"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-border/70"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-border/70 bg-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 break-words pr-12 sm:pr-20 md:pr-40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/track/${t?.id ?? r.trackId}`}
                        className="font-medium hover:text-primary transition-colors truncate"
                      >
                        {t?.name ?? "Unknown track"}
                      </Link>
                      <span className="text-xs text-muted-foreground">/</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {(t?.artists ?? []).join(", ")}
                        {t?.album ? ` - ${t.album}` : ""}
                      </span>
                    </div>

                    <div className="mt-2 text-sm flex flex-wrap items-center gap-2">
                      <GrooveBars value={r.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">{r.rating}/5</span>
                      {r.title ? <span className="text-muted-foreground">- {r.title}</span> : null}
                    </div>

                    {r.body && (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {r.body}
                      </p>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground">{createdStr}</div>
                  </div>

                  <div className="sm:ml-auto -mt-1">
                    <div className="hidden md:flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(r)}
                        aria-label="Edit review"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleting(r)}
                        aria-label="Delete review"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="More actions"
                            title="More"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="w-40">
                          <DropdownMenuItem onClick={() => openEdit(r)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => (!o ? closeEdit() : null)}>
        <DialogContent key={editing?.id} onOpenAutoFocus={(e) => e.preventDefault()}>
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
            autoFocus
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
            maxLength={BODY_MAX + 200}
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
