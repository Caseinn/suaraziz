import type { MetadataRoute } from "next"
import { seoConfig } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const routes = ["/", "/sign-in"]

  return routes.map((route) => ({
    url: `${seoConfig.origin}${route}`,
    lastModified,
  }))
}
