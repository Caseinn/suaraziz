"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

type Comment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name?: string | null
    image?: string | null
  }
}

export function Comments({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Comment[]>([])
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [body, setBody] = React.useState("")

  const boot = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments?limit=5`, { cache: "no-store" })
      const json = (await res.json()) as { items: Comment[]; nextCursor: string | null }
      setItems([...json.items].reverse())
      setNextCursor(json.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  React.useEffect(() => {
    if (open && items.length === 0 && !loading) void boot()
  }, [open, items.length, loading, boot])

  const loadMore = async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/reviews/${reviewId}/comments?limit=5&cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" }
      )
      const json = (await res.json()) as { items: Comment[]; nextCursor: string | null }
      const olderAsc = [...json.items].reverse()
      setItems((prev) => [...olderAsc, ...prev])
      setNextCursor(json.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    const text = body.trim()
    if (!text) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      if (res.status === 401) {
        toast.info("Sign in to comment.")
        return
      }
      if (!res.ok) throw new Error()
      const { comment } = (await res.json()) as { comment: Comment }
      setItems((prev) => [...prev, comment])
      setBody("")
    } catch {
      toast.error("Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide comments" : "View comments"}
      </button>

      {open && (
        <div className="mt-3 sm:mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Leave a note"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              className="bg-input/40"
            />
            <Button
              onClick={submit}
              disabled={loading || !body.trim()}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </Button>
          </div>

          <ul className="space-y-3">
            {items.map((c) => {
              const created = new Date(c.createdAt)
              const timeStr = created.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
              const name = c.author?.name || "User"

              return (
                <li
                  key={c.id}
                  className="flex items-start gap-3 text-sm border-b border-border/70 pb-3"
                >
                  {c.author?.image ? (
                    <Image
                      src={c.author.image}
                      alt={name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full border border-border/70 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {name[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <Link
                        href={`/user/${c.author?.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {name}
                      </Link>
                      <time
                        dateTime={created.toISOString()}
                        className="text-[11px] text-muted-foreground whitespace-nowrap ml-2"
                        title={timeStr}
                      >
                        {timeStr}
                      </time>
                    </div>
                    <p className="text-muted-foreground break-words">{c.body}</p>
                  </div>
                </li>
              )}
            )}
          </ul>

          {nextCursor && (
            <div>
              <Button size="sm" variant="ghost" onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load older"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
