// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import ToastOnAuth from "@/components/toast-on-auth"
import { Suspense } from "react"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SuarAziz",
  description: "Review your favorite tracks",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen flex flex-col ${geistSans.variable} ${geistMono.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-center" closeButton />
        <Suspense fallback={null}>
          <ToastOnAuth />
        </Suspense>
      </body>
    </html>
  )
}