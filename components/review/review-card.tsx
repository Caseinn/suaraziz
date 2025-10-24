"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Stars } from "@/components/home/stars"
import { LikeButton } from "@/components/review/like-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Author = {
  id: string
  displayName?: string | null
  name?: string | null
  image?: string | null
}

type Review = {
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

export function ReviewCard({
  review,
  mine,
  like,
  onToggleLike,
  onEdit,
  onDelete,
  children,
}: {
  review: Review
  mine: boolean
  like: LikeState
  onToggleLike: () => void | Promise<void>
  onEdit?: (r: Review) => void
  onDelete?: (r: Review) => void
  children?: React.ReactNode
}) {
  const r = review
  const name = r.author?.displayName || r.author?.name || "User"
  const initial = (name?.[0] || "U").toUpperCase()
  const createdIso = new Date(r.createdAt).toISOString()

  return (
    <article className="rounded-2xl border p-4 bg-card/50 hover:shadow-sm transition-all">
      {/* Header row — stacks on mobile */}
      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        {r.author?.image ? (
          <Image
            src={r.author.image}
            alt={name}
            width={40}
            height={40}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full border object-cover"
          />
        ) : (
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm md:text-base font-semibold">
            {initial}
          </div>
        )}

        {/* Content — reserve space on right so text never overlaps absolute actions */}
        <div className="flex-1 min-w-0 pr-14 md:pr-16 break-words">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-[15px]">
            <Link
              href={`/user/${r.authorId}`}
              className="font-medium truncate hover:underline hover:text-primary transition-colors"
            >
              {name}
            </Link>
            <span className="text-muted-foreground">•</span>
            <time dateTime={createdIso} className="text-muted-foreground">
              {new Date(r.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </div>

          <div className="mt-1 text-sm md:text-[15px] flex flex-wrap items-center gap-2">
            <Stars value={r.rating} />
            <span className="text-xs md:text-sm text-muted-foreground">{r.rating}/5</span>
            {r.title ? <span className="text-sm md:text-base">— {r.title}</span> : null}
          </div>

          {r.body && (
            <p className="mt-2 text-sm md:text-[15px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {r.body}
            </p>
          )}
        </div>

        {/* Actions — absolute top-right; mobile uses kebab */}
        <div className="absolute top-0 right-0 flex items-center gap-1 whitespace-nowrap">
          {/* Like: visible on all breakpoints; larger tap target on mobile */}
          <LikeButton liked={like.liked} likes={like.likes} onToggle={onToggleLike} />

          {/* Desktop (≥ md): separate buttons */}
          {mine && (
            <div className="hidden md:flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onEdit?.(r)}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete?.(r)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Mobile (< md): kebab menu */}
          {mine && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 md:hidden"
                  aria-label="More actions"
                  title="More"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit?.(r)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(r)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Full-width comments */}
      {children && <div className="mt-3 pt-3 border-t">{children}</div>}
    </article>
  )
}
