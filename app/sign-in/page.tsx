// app/sign-in/page.tsx
"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { FaSpotify } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// helper: append/replace a query param in a (possibly relative) URL
function withQueryParam(url: string, key: string, value: string) {
  try {
    // Use current origin to safely parse relative paths like "/track/123"
    const u = new URL(url, window.location.origin)
    u.searchParams.set(key, value)
    return u.pathname + (u.search ? `?${u.searchParams.toString()}` : "") + (u.hash || "")
  } catch {
    // if something odd, just return the original url
    return url
  }
}

/** Wraps the content that uses useSearchParams in a Suspense boundary */
function SignInInner() {
  const [loading, setLoading] = React.useState(false)
  const search = useSearchParams()
  const rawCallback = search.get("callbackUrl") || "/"
  const callbackUrl = withQueryParam(rawCallback, "signedIn", "1")

  const handleSpotifySignIn = async () => {
    const t = toast.loading("Opening Spotify…")
    try {
      setLoading(true)
      await signIn("spotify", { callbackUrl }) // NextAuth will redirect
    } catch {
      toast.dismiss(t)
      toast.error("Failed to start sign in. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your Spotify account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleSpotifySignIn}
              className="w-full h-12 gap-2 border-primary/30 hover:bg-primary/5 cursor-pointer"
            >
              <FaSpotify className="w-5 h-5 text-[#1DB954]" />
              {loading ? "Redirecting…" : "Continue with Spotify"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  )
}
