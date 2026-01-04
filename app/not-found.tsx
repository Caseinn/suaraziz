// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-6 md:px-8 py-16 sm:py-24 text-center space-y-5 sm:space-y-6">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
          Archive error
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display">404 - Not found</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90 transition text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
        >
          Return home
        </Link>

        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-border/70 px-5 py-2 hover:border-primary/60 transition text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
        >
          Explore trending
        </Link>
      </div>

      <div className="text-[11px] sm:text-xs text-muted-foreground">
        Try searching from the homepage or browse the latest entries.
      </div>
    </div>
  )
}
