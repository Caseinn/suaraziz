// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/requireUser"
import { revalidatePath } from "next/cache"
import { isTrustedOrigin, rateLimit } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 })
  }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success, reset } = await rateLimit(`comments:delete:${userId}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }
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
