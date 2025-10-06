"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function ToastOnAuth() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!params) return

    const signedIn = params.get("signedIn")
    const signedOut = params.get("signedOut")
    const error = params.get("error") // NextAuth may pass this on failure

    if (signedIn === "1") toast.success("Signed in successfully!")
    if (signedOut === "1") toast.success("Signed out successfully!")
    if (error) toast.error(decodeURIComponent(error))

    // Clean the URL (remove our params) without a full reload
    if (signedIn || signedOut || error) {
      const url = new URL(window.location.href)
      url.searchParams.delete("signedIn")
      url.searchParams.delete("signedOut")
      url.searchParams.delete("error")
      router.replace(url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""))
    }
  }, [params, router])

  return null
}
