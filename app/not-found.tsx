// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
        404 — Not found
      </h1>
      <p className="mt-3 text-sm md:text-base text-muted-foreground">
        The page you’re looking for doesn’t exist or has moved.
      </p>

      {/* Action */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition"
        >
          Go home
        </Link>

        <Link
          href="/"
          className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-accent transition"
        >
          Explore trending
        </Link>
      </div>

      {/* Hint links */}
      <div className="mt-6 text-xs text-muted-foreground">
        Try searching from the homepage, or check out what’s popular.
      </div>
    </div>
  )
}
