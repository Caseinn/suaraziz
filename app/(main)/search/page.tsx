import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Item } from "@/components/home/types"
import { seoConfig } from "@/lib/seo"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 10

type SearchParams = {
  q?: string
  page?: string
}

type SearchResponse = {
  items: Item[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const query = (params.q ?? "").trim()
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)

  if (!query) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Search archive
          </p>
          <h1 className="text-2xl sm:text-3xl font-display">No query yet</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Use the search bar in the header to find a track.
          </p>
        </div>
        <Card className="border-border/70 bg-card/70">
          <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground">
            Start with an artist, song title, or album name.
          </CardContent>
        </Card>
      </div>
    )
  }

  const baseUrl = seoConfig.origin
  const res = await fetch(
    `${baseUrl}/api/search?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&page=${page}`,
    { cache: "no-store" }
  )

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="border-border/70 bg-card/70">
          <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground">
            Search is unavailable right now. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = (await res.json()) as SearchResponse
  const items = data.items ?? []
  const total = typeof data.total === "number" ? data.total : items.length
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0
  const offset = (page - 1) * PAGE_SIZE

  const prevPage = page - 1
  const nextPage = page + 1
  const hasPrev = page > 1
  const hasNext = totalPages === 0 ? items.length === PAGE_SIZE : page < totalPages

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
          Search archive
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display">
          Results for{" "}
          <span className="text-primary">
            &ldquo;{query}&rdquo;
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {total} {total === 1 ? "result" : "results"} found
          {totalPages > 0 ? ` - Page ${page} of ${totalPages}` : ""}
        </p>
      </header>

      {items.length === 0 ? (
        <Card className="border-border/70 bg-card/70">
          <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground">
            No results found. Try a different query.
          </CardContent>
        </Card>
      ) : (
        <ol className="space-y-3 sm:space-y-4 border-l border-border/70 pl-4 sm:pl-6">
          {items.map((t, idx) => (
            <li key={t.id} className="relative">
              <span className="absolute -left-[7px] sm:-left-[9px] top-6 h-2.5 w-2.5 rounded-full bg-primary/80" />
              <Link
                href={`/track/${t.id}`}
                className="group block rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5 hover:border-primary/60 transition"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    {String(offset + idx + 1).padStart(2, "0")}
                  </span>
                  {t.image ? (
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-border/70 shrink-0">
                      <Image
                        src={t.image}
                        alt={t.name}
                        width={56}
                        height={56}
                        loading="lazy"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted border border-border/70 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold truncate group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {t.artists.join(", ")}
                      {t.album ? ` - ${t.album}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {hasPrev ? (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${prevPage}`}
              className="inline-flex items-center rounded-full border border-border/70 px-3 sm:px-4 py-1.5 sm:py-2 hover:border-primary/60 hover:text-primary transition"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border/40 px-3 sm:px-4 py-1.5 sm:py-2 opacity-60">
              Previous
            </span>
          )}

          <span>{`Page ${page} of ${totalPages}`}</span>

          {hasNext ? (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${nextPage}`}
              className="inline-flex items-center rounded-full border border-border/70 px-3 sm:px-4 py-1.5 sm:py-2 hover:border-primary/60 hover:text-primary transition"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border/40 px-3 sm:px-4 py-1.5 sm:py-2 opacity-60">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
