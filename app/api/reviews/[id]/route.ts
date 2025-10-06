// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"

type PatchBody = {
  title?: string | null
  body?: string
  rating?: number
}

// PATCH /api/reviews/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId()
  const { id } = await ctx.params

  const payload = (await req.json()) as PatchBody

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data: PatchBody = {}
  if (typeof payload.title !== "undefined") data.title = payload.title ?? null
  if (typeof payload.body !== "undefined") data.body = String(payload.body ?? "")
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

  return NextResponse.json({ review })
}

// DELETE /api/reviews/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId()
  const { id } = await ctx.params

  const exists = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (exists.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
