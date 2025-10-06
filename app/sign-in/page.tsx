// app/sign-in/page.tsx
"use client"

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
import * as React from "react"

export default function SignInPage() {
  const [loading, setLoading] = React.useState(false)

  const handleSpotifySignIn = async () => {
    try {
      setLoading(true)
      toast.loading("Opening Spotify…")
      // Use query flag so a success toast can show after redirect via ToastOnAuth
      await signIn("spotify", { callbackUrl: "/?signedIn=1" })
    } catch {
      toast.dismiss()
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
              className="w-full h-12 gap-2 border-primary/30 hover:bg-primary/5"
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
