"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GROOVE_SIZES } from "@/components/ui/groove"

type GrooveSize = keyof typeof GROOVE_SIZES

type GrooveRatingInputProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: GrooveSize
  label?: string
  className?: string
}

const INPUT_GAPS: Record<GrooveSize, string> = {
  sm: "gap-0.5 sm:gap-1",
  md: "gap-1 sm:gap-1.5",
  lg: "gap-1 sm:gap-1.5 md:gap-2",
}

export function GrooveRatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
  label = "Rating out of 5",
  className,
}: GrooveRatingInputProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const config = GROOVE_SIZES[size]
  const gap = INPUT_GAPS[size] ?? config.gap
  const total = config.heights.length
  const active = hovered ?? value

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === "ArrowRight") {
      e.preventDefault()
      onChange(Math.min(total, Math.max(1, value + 1)))
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      onChange(Math.max(1, value - 1))
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn("inline-flex items-end", gap)}
        role="radiogroup"
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
      >
        {config.heights.map((height, index) => {
          const rating = index + 1
          const isActive = active >= rating
          return (
            <button
              key={height + rating}
              type="button"
              role="radio"
              aria-checked={value === rating}
              disabled={disabled}
              onMouseEnter={() => !disabled && setHovered(rating)}
              onMouseLeave={() => !disabled && setHovered(null)}
              onFocus={() => !disabled && setHovered(rating)}
              onBlur={() => !disabled && setHovered(null)}
              onClick={() => !disabled && onChange(rating)}
              className={cn(
                "flex items-end rounded-md px-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <span
                className={cn(
                  "block rounded-full transition-colors",
                  config.width,
                  height,
                  isActive ? "bg-primary" : "bg-muted-foreground/40"
                )}
              />
              <span className="sr-only">{rating} out of 5</span>
            </button>
          )
        })}
      </div>
      <span className="ml-3 text-xs text-muted-foreground">{value}/5</span>
    </div>
  )
}
