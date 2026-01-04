// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
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
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        const target = new URL(url)
        if (target.origin === baseUrl) return url
      } catch {
        // ignore invalid urls
      }
      return baseUrl
    },
  },
  events: {
    async signIn({ account }) {
      if (!account?.provider || !account?.providerAccountId) return
      try {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: {
            access_token: null,
            refresh_token: null,
            id_token: null,
            scope: null,
            token_type: null,
            expires_at: null,
            session_state: null,
          },
        })
      } catch {
        // ignore if account not found yet
      }
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
