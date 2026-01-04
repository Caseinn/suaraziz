import { cn } from "@/lib/utils"

const GROOVE_SIZES = {
  sm: {
    gap: "gap-0.5 sm:gap-1 md:gap-1 lg:gap-1.5",
    width: "w-1 sm:w-1.5 md:w-1.5 lg:w-2",
    heights: [
      "h-2 sm:h-3 md:h-3 lg:h-4",
      "h-3 sm:h-4 md:h-4 lg:h-5",
      "h-4 sm:h-5 md:h-5 lg:h-6",
      "h-5 sm:h-6 md:h-6 lg:h-7",
      "h-6 sm:h-7 md:h-7 lg:h-8",
    ], // 1 lowest -> 5 highest
  },
  md: {
    gap: "gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2",
    width: "w-1.5 sm:w-2 md:w-2 lg:w-2.5",
    heights: [
      "h-3 sm:h-4 md:h-4 lg:h-5",
      "h-4 sm:h-5 md:h-5 lg:h-6",
      "h-5 sm:h-6 md:h-6 lg:h-7",
      "h-6 sm:h-7 md:h-7 lg:h-8",
      "h-7 sm:h-8 md:h-8 lg:h-9",
    ], // 1 lowest -> 5 highest
  },
  lg: {
    gap: "gap-1.5 sm:gap-2 md:gap-2 lg:gap-2.5",
    width: "w-2 sm:w-2.5 md:w-2.5 lg:w-3",
    heights: [
      "h-4 sm:h-5 md:h-5 lg:h-6",
      "h-5 sm:h-6 md:h-6 lg:h-7",
      "h-6 sm:h-7 md:h-7 lg:h-8",
      "h-7 sm:h-8 md:h-8 lg:h-9",
      "h-8 sm:h-9 md:h-9 lg:h-10",
    ], // 1 lowest -> 5 highest
  },
} as const

type GrooveSize = keyof typeof GROOVE_SIZES

type GrooveBarsProps = {
  value: number
  size?: GrooveSize
  className?: string
  label?: string
}

export function GrooveBars({ value, size = "md", className, label }: GrooveBarsProps) {
  const config = GROOVE_SIZES[size]
  const total = config.heights.length
  const filled = Math.max(0, Math.min(total, Math.round(value)))
  const aria = label ?? `${filled} out of ${total}`

  return (
    <span
      role="img"
      aria-label={aria}
      className={cn("inline-flex items-end", config.gap, className)}
    >
      {config.heights.map((height, index) => (
        <span
          key={height + index}
          className={cn(
            "rounded-full transition-colors",
            config.width,
            height,
            index + 1 <= filled ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      ))}
    </span>
  )
}

type GrooveMeterProps = {
  value: number
  size?: number
  className?: string
  label?: string
}

export function GrooveMeter({
  value,
  size = 104,
  className,
  label,
}: GrooveMeterProps) {
  const clamped = Math.max(0, Math.min(5, value))
  const percent = (clamped / 5) * 360
  const aria = label ?? `${clamped.toFixed(1)} out of 5`

  return (
    <div
      role="img"
      aria-label={aria}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${percent}deg, rgba(242, 242, 242, 0.12) 0deg)`,
        }}
      />
      <div className="absolute inset-[10%] rounded-full border border-border/70 bg-background/90 backdrop-blur">
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <div className="font-display text-lg">{clamped.toFixed(1)}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Avg
          </div>
        </div>
      </div>
    </div>
  )
}

export { GROOVE_SIZES }
