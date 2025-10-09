// app/track/[id]/page.tsx
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ReviewForm from "@/components/review/review-form"
import ReviewsList from "@/components/review/review-list"
import { unstable_noStore as noStore } from "next/cache"

const PAGE_SIZE = 10

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

function Stars({ value }: { value: number }) {
  const v = Math.round(value)
  return (
    <span
      aria-label={`${value.toFixed(1)} out of 5`}
      className="inline-flex items-center gap-1 text-yellow-500/90"
    >
      {"★".repeat(v)}
      <span className="text-muted-foreground">{"★".repeat(5 - v)}</span>
    </span>
  )
}

// NOTE: params is a Promise in your setup → await it.
export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  noStore()

  const { id } = await params

  const track = await prisma.track.findUnique({ where: { id } })
  if (!track) return <div className="p-6">Track not found.</div>

  const [avgAgg, firstItemsPlusOne, session] = await Promise.all([
    prisma.review.aggregate({ where: { trackId: id }, _avg: { rating: true } }),
    prisma.review.findMany({
      where: { trackId: id },
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
    }),
    getServerSession(authOptions),
  ])

  let nextCursor: string | null = null
  let initialItems = firstItemsPlusOne
  if (firstItemsPlusOne.length > PAGE_SIZE) {
    nextCursor = firstItemsPlusOne[firstItemsPlusOne.length - 1].id
    initialItems = firstItemsPlusOne.slice(0, PAGE_SIZE)
  }

  const avg = avgAgg._avg.rating ?? 0
  const user = session?.user as SessionUser | undefined
  const currentUserId = user?.id ?? null

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start gap-4">
        {track.albumImage && (
          <Image
            src={track.albumImage}
            alt={track.name}
            width={96}
            height={96}
            loading="lazy"
            className="w-24 h-24 rounded-xl object-cover border"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{track.name}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {track.artists.join(", ")}
            {track.album ? ` — ${track.album}` : ""}
          </p>
          <div className="mt-2 text-sm inline-flex items-center gap-2">
            <strong className="font-semibold">{avg.toFixed(1)}</strong>
            <Stars value={avg} />
            <span className="text-muted-foreground">avg</span>
          </div>
        </div>
      </header>

      {/* Form (locked if signed out) */}
      <ReviewForm trackId={track.id} disabled={!currentUserId} signInHref="/sign-in" />

      {/* Reviews */}
      <ReviewsList
        trackId={track.id}
        initialItems={initialItems}
        initialNextCursor={nextCursor}
        pageSize={PAGE_SIZE}
        currentUserId={currentUserId}
      />
    </div>
  )
}
