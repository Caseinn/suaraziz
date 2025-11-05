import { buildJsonLd } from "@/lib/seo"

export default function Head() {
  const jsonLd = buildJsonLd()

  return (
    <>
      <script
        id="suaraziz-schema"
        type="application/ld+json"
        // Inject structured data for search engines.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
