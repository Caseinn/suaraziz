// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import ToastOnAuth from "@/components/toast-on-auth"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { getSocialImageUrl, seoConfig } from "@/lib/seo"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const socialImage = getSocialImageUrl()

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: seoConfig.metadataBase,
    title: {
      default: seoConfig.title,
      template: `%s - ${seoConfig.title}`,
    },
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    authors: [{ name: seoConfig.title }],
    creator: seoConfig.title,
    publisher: seoConfig.title,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: seoConfig.origin,
      title: seoConfig.title,
      description: seoConfig.description,
      siteName: seoConfig.title,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: seoConfig.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoConfig.title,
      description: seoConfig.description,
      creator: seoConfig.twitterHandle,
      images: [socialImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: seoConfig.googleVerification,
    },
    category: seoConfig.category,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen flex flex-col ${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" closeButton />
          <Suspense fallback={null}>
            <ToastOnAuth />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
