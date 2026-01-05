import { headers } from "next/headers"
import { buildJsonLd } from "@/lib/seo"

export default async function Head() {
  const nonce = (await headers()).get("x-nonce") ?? undefined
  const jsonLd = buildJsonLd()

  return (
    <>
      <script
        id="suaraziz-schema"
        type="application/ld+json"
        nonce={nonce}
        // Inject structured data for search engines.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
