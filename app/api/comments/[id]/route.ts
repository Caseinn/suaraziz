// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId()
  const { id } = await ctx.params

  const c = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, review: { select: { trackId: true } } },
  })
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (c.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id } })
  revalidatePath(`/track/${c.review.trackId}`)
  return NextResponse.json({ ok: true })
}
