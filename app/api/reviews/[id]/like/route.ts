// app/api/reviews/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

const key = (userId: string, reviewId: string) => ({
  userId_reviewId: { userId, reviewId },
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: reviewId } = await params

  // always return the count
  const countRow = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { likes: true },
  })
  let liked = false

  // if logged in, check if THIS user liked it
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (userId) {
    const existing = await prisma.like.findUnique({ where: key(userId, reviewId) })
    liked = !!existing
  }

  return NextResponse.json({ likes: countRow?.likes ?? 0, liked })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId()
  const { id: reviewId } = await params

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, trackId: true },
  })
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })

  const existing = await prisma.like.findUnique({ where: key(userId, reviewId) })

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: key(userId, reviewId) }),
      prisma.review.update({ where: { id: reviewId }, data: { likes: { decrement: 1 } } }),
    ])
  } else {
    await prisma.$transaction([
      prisma.like.create({ data: { userId, reviewId } }),
      prisma.review.update({ where: { id: reviewId }, data: { likes: { increment: 1 } } }),
    ])
  }

  const likes = (await prisma.review.findUnique({ where: { id: reviewId }, select: { likes: true } }))?.likes ?? 0
  revalidatePath(`/track/${review.trackId}`)
  return NextResponse.json({ liked: !existing, likes })
}
