// components/home/Stars.tsx
export function Stars({ value }: { value: number }) {
  const v = Math.round(value)
  return (
    <span aria-label={`${v} out of 5 stars`} className="text-yellow-500/90">
      {"★".repeat(v)}
      <span className="text-muted-foreground">{"★".repeat(5 - v)}</span>
    </span>
  )
}
