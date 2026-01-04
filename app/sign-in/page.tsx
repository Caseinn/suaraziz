// app/sign-in/page.tsx
"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { FaGoogle } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function withQueryParam(url: string, key: string, value: string) {
  try {
    const u = new URL(url, window.location.origin)
    u.searchParams.set(key, value)
    return u.pathname + (u.search ? `?${u.searchParams.toString()}` : "") + (u.hash || "")
  } catch {
    return url
  }
}

function SignInInner() {
  const [loading, setLoading] = React.useState(false)
  const search = useSearchParams()
  const rawCallback = search.get("callbackUrl") || "/"
  const callbackUrl = withQueryParam(rawCallback, "signedIn", "1")

  const handleGoogleSignIn = async () => {
    const t = toast.loading("Opening Google...")
    try {
      setLoading(true)
      await signIn("google", { callbackUrl })
    } catch {
      toast.dismiss(t)
      toast.error("Failed to start sign in. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 sm:px-6 md:px-8 py-12 sm:py-16">
      <div className="w-full max-w-lg space-y-5 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Entry access
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display">Sign in to write</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            We use Google to confirm your identity and connect you to the archive.
          </p>
        </div>

        <Card className="border-border/70 bg-card/80">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <Button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 sm:h-12 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-[11px] uppercase tracking-[0.3em]"
            >
              <FaGoogle className="w-5 h-5 text-black" />
              {loading ? "Redirecting..." : "Continue with Google"}
            </Button>
            <p className="text-[11px] sm:text-xs text-muted-foreground text-center">
              We never post without your permission.
            </p>
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
