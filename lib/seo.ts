const FALLBACK_URL = "http://localhost:3000"

const siteTitle = "SuarAziz"
const siteDescription = "Review your favorite tracks"
const twitterHandle = "@suaraziz"
const googleVerification = "1KI_k0smkrnjh8xv7tnvvsSeD9YGTbZPnxJBtKveNSE"

function resolveSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    FALLBACK_URL

  try {
    return new URL(rawUrl)
  } catch {
    return new URL(FALLBACK_URL)
  }
}

const siteUrl = resolveSiteUrl()

export const seoConfig = {
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "music reviews",
    "track reviews",
    "album reviews",
    "album ratings",
    "music discovery",
    "playlist recommendations",
    "new music releases",
    "indie music blog",
    "hip hop reviews",
    "pop music ratings",
    "electronic music critique",
    "best songs 2025",
    "music community",
    "fan reviews",
    "music discussion board",
    "SuarAziz",
    "Suara Aziz",
    "Suaraziz",
  ],
  twitterHandle,
  googleVerification,
  category: "Music",
  metadataBase: siteUrl,
  origin: siteUrl.origin,
}

export function buildJsonLd() {
  const searchUrl = `${seoConfig.origin}/search?query={search_term_string}`

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.title,
    url: seoConfig.origin,
    description: seoConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: searchUrl,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.title,
    },
  }
}

export function getSocialImageUrl() {
  return `${seoConfig.origin}/opengraph-image.png`
}
