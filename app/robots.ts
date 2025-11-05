import type { MetadataRoute } from "next"
import { seoConfig } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${seoConfig.origin}/sitemap.xml`,
    host: seoConfig.origin,
  }
}
