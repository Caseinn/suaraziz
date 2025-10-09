// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

type PatchBody = {
  title?: string | null
  body?: string
  rating?: number
}

const BODY_MAX = 800

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId()
  const { id } = await ctx.params  // ⬅️ await

  const payload = (await req.json()) as PatchBody

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true, trackId: true },
  })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data: PatchBody = {}
  if (typeof payload.title !== "undefined") data.title = payload.title ?? null
  if (typeof payload.body !== "undefined") {
    const b = String(payload.body ?? "")
    if (b.length === 0 || b.length > BODY_MAX) {
      return NextResponse.json({ error: "Invalid body length" }, { status: 400 })
    }
    data.body = b
  }
  if (typeof payload.rating !== "undefined") {
    const r = Number(payload.rating)
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
    }
    data.rating = r
  }

  const review = await prisma.review.update({
    where: { id },
    data,
    include: { author: true },
  })

  revalidatePath(`/track/${exists.trackId}`)
  return NextResponse.json({ review })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId()
  const { id } = await ctx.params  // ⬅️ await

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true, trackId: true },
  })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  revalidatePath(`/track/${exists.trackId}`)
  return NextResponse.json({ ok: true })
}
