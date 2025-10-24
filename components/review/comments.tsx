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

  // initial load — oldest first
  const boot = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments?limit=5`, { cache: "no-store" })
      const json = (await res.json()) as { items: Comment[]; nextCursor: string | null }
      setItems([...json.items].reverse())
      setNextCursor(json.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open && items.length === 0 && !loading) void boot()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

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
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide comments" : "View comments"}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {/* Comment input */}
          <div className="flex gap-2">
            <Input
              placeholder="Write a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
            />
            <Button onClick={submit} disabled={loading || !body.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </Button>
          </div>

          {/* Comments list */}
          <ul className="space-y-2">
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
                  className="flex items-start gap-3 text-sm border-b border-muted/20 pb-2"
                >
                  {/* Avatar */}
                    {c.author?.image ? (
                      <Image
                        src={c.author.image}
                        alt={name}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                        {name[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}

                  {/* Body + Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/user/${c.author?.id}`}
                        className="font-medium hover:underline hover:text-primary transition-colors"
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
              )
            })}
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
