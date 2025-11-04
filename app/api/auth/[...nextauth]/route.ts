// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "database" },
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-email user-read-private",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      const idFromContext = user?.id ?? token?.sub

      if (session.user && idFromContext) {
        ;(session.user as { id?: string }).id = idFromContext
        return session
      }

      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })

        if (dbUser?.id) {
          ;(session.user as { id?: string }).id = dbUser.id
        }
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
