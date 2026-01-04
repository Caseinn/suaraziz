// app/profile/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Music2, Calendar } from "lucide-react"
import ProfileReviews from "@/components/profile/profile-reviews"

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

type TrackLite = {
  id: string
  name: string
  artists: string[]
  album: string
  albumImage: string | null
}

type ReviewWithTrack = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: Date
  updatedAt: Date
  authorId: string
  trackId: string
  track: TrackLite
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined

  if (!user?.id) {
    return (
      <div className="mx-auto max-w-3xl py-12 sm:py-16 text-center space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl font-display">Your profile</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sign in to view your reviews and favorites.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90 transition text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const [agg, myReviews, favs] = await Promise.all([
    prisma.review.aggregate({
      where: { authorId: user.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { authorId: user.id },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            artists: true,
            album: true,
            albumImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }) as unknown as Promise<ReviewWithTrack[]>,
    prisma.review.findMany({
      where: { authorId: user.id, rating: 5 },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            artists: true,
            album: true,
            albumImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }) as unknown as Promise<ReviewWithTrack[]>,
  ])

  const avgGiven = agg._avg.rating ?? 0
  const totalReviews = agg._count

  const reviewsForClient = myReviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
      <header className="rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={64}
                height={64}
                loading="lazy"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-border/70 object-cover"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-lg sm:text-xl font-semibold">
                {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Archive profile
              </p>
              <h1 className="text-xl sm:text-2xl font-display truncate">
                {user.name ?? "User"}
              </h1>
              {user.email && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
          </div>

<div className="grid w-full grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-5 md:w-auto">
  {[
    {
      label: "Total",
      value: totalReviews,
      icon: <Music2 className="h-4 w-4 lg:h-5 lg:w-5" />,
    },
    {
      label: "Avg",
      value: avgGiven.toFixed(1),
      icon: null,
    },
    {
      label: "5/5",
      value: favs.length,
      icon: <Heart className="h-4 w-4 lg:h-5 lg:w-5" />,
    },
  ].map(({ label, value, icon }) => (
    <div
      key={label}
      className="
        flex flex-col justify-between
        rounded-2xl border border-border/70 bg-card/70
        p-2.5 sm:p-3 lg:p-4 xl:p-5
        min-h-[72px] lg:min-h-[96px]
        lg:min-w-[120px] xl:min-w-[140px]
      "
    >
      {/* Header */}
      <div className="flex h-5 lg:h-6 items-center justify-between text-[10px] sm:text-[11px] lg:text-[12px] text-muted-foreground">
        <span>{label}</span>
        <span className="inline-flex h-4 w-4 lg:h-5 lg:w-5 items-center justify-center">
          {icon}
        </span>
      </div>

      {/* Value */}
      <div className="mt-1 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  ))}
</div>

        </div>
      </header>

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Favorites</p>
            <h2 className="mt-2 text-base sm:text-lg font-display">Five out of five</h2>
          </div>
          <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">
            Tracks you rated 5/5.
          </p>
        </div>

        {favs.length === 0 ? (
          <Card className="border-border/70 bg-card/70">
            <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground text-center">
              You do not have any 5/5 favorites yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="md:hidden -mx-5 px-5 sm:px-6">
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar">
                {favs.map((r) => {
                  const t = r.track
                  return (
                    <Link
                      key={r.id}
                      href={`/track/${t?.id ?? r.trackId}`}
                      className="group min-w-[78%] snap-start block rounded-2xl border border-border/70 bg-card/70 hover:border-primary/40 transition-all"
                    >
                      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/70 shrink-0">
                          {t?.albumImage ? (
                            <Image
                              src={t.albumImage}
                              alt={t.name}
                              width={56}
                              height={56}
                              loading="lazy"
                              className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate group-hover:text-primary transition-colors">
                            {t?.name ?? "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {(t?.artists ?? []).join(", ")}
                            {t?.album ? ` - ${t.album}` : ""}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
              {favs.map((r) => {
                const t = r.track
                return (
                  <Link
                    key={r.id}
                    href={`/track/${t?.id ?? r.trackId}`}
                    className="group block rounded-2xl border border-border/70 bg-card/70 hover:border-primary/40 transition-all focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-border/70">
                        {t?.albumImage ? (
                          <Image
                            src={t.albumImage}
                            alt={t.name}
                            width={56}
                            height={56}
                            loading="lazy"
                            className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate group-hover:text-primary transition-colors">
                          {t?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(t?.artists ?? []).join(", ")}
                          {t?.album ? ` - ${t.album}` : ""}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>

      <div className="h-px bg-border/80" />

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-lg font-display">Your reviews</h2>
          <div className="text-[11px] sm:text-xs text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Sorted by most recent
          </div>
        </div>

        <ProfileReviews initialItems={reviewsForClient} />
      </section>
    </div>
  )
}
