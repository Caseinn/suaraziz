// lib/requireUser.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { Session } from "next-auth"

export async function requireUserId(): Promise<string> {
  const session = (await getServerSession(authOptions)) as Session | null
  const id = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined

  if (!id) {
    throw new Error("Unauthorized")
  }
  return id
}
