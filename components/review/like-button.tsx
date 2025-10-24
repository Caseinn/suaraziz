"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function LikeButton({
  liked,
  likes,
  onToggle,
}: {
  liked: boolean
  likes: number
  onToggle: () => void | Promise<void>
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-9 md:h-8 px-3 md:px-2 rounded-full"
      aria-pressed={liked}
      aria-label={liked ? "Unlike review" : "Like review"}
      onClick={onToggle}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart className={cn("h-5 w-5 md:h-4 md:w-4", liked && "fill-current text-red-500")} />
      <span className="ml-1 text-xs md:text-[11px]">{likes}</span>
    </Button>
  )
}
