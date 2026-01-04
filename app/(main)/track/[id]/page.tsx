// app/track/[id]/page.tsx
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ReviewForm from "@/components/review/review-form"
import ReviewsList from "@/components/review/review-list"
import { GrooveMeter } from "@/components/ui/groove"
import { unstable_noStore as noStore } from "next/cache"

const PAGE_SIZE = 10

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  noStore()

  const { id } = await params

  const track = await prisma.track.findUnique({ where: { id } })
  if (!track) return <div className="p-6">Track not found.</div>

  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  const currentUserId = user?.id ?? null

  const [agg, firstItemsPlusOne, existingReview] = await Promise.all([
    prisma.review.aggregate({
      where: { trackId: id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { trackId: id },
      select: {
        id: true,
        trackId: true,
        authorId: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, displayName: true, image: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
    }),
    currentUserId
      ? prisma.review.findFirst({
          where: { trackId: id, authorId: currentUserId },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  let nextCursor: string | null = null
  let initialItems = firstItemsPlusOne
  if (firstItemsPlusOne.length > PAGE_SIZE) {
    nextCursor = firstItemsPlusOne[firstItemsPlusOne.length - 1].id
    initialItems = firstItemsPlusOne.slice(0, PAGE_SIZE)
  }

  const avg = agg._avg.rating ?? 0
  const total = agg._count ?? 0
  const hasReviewed = !!existingReview

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6 md:p-8">
        {track.albumImage && (
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={track.albumImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-20 blur-3xl scale-110"
            />
          </div>
        )}
        <div className="relative flex flex-col md:flex-row gap-6">
          {track.albumImage && (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 shrink-0 overflow-hidden rounded-2xl border border-border/70">
              <Image
                src={track.albumImage}
                alt={track.name}
                width={208}
                height={208}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Track entry
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-display leading-tight truncate">
                {track.name}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {track.artists.join(", ")}
                {track.album ? ` - ${track.album}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <GrooveMeter value={avg} size={96} className="scale-90 sm:scale-100 origin-left" />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Archive average
                </p>
                <p className="text-xs text-muted-foreground">
                  {total} {total === 1 ? "review" : "reviews"} logged
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              Your entry
            </p>
            <h2 className="mt-2 text-lg sm:text-xl font-display">Write your thoughts</h2>
          </div>
          <ReviewForm
            trackId={track.id}
            disabled={!currentUserId || hasReviewed}
            lockReason={!currentUserId ? "auth" : hasReviewed ? "existing" : null}
            signInHref="/sign-in"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              Community notes
            </p>
            <h2 className="mt-2 text-lg sm:text-xl font-display">Recent reflections</h2>
          </div>
          <ReviewsList
            trackId={track.id}
            initialItems={initialItems}
            initialNextCursor={nextCursor}
            pageSize={PAGE_SIZE}
            currentUserId={currentUserId}
          />
        </div>
      </section>
    </div>
  )
}
