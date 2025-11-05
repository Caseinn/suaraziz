import { ImageResponse } from "next/og"
import { seoConfig } from "@/lib/seo"

export const runtime = "edge"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}

export default function OpengraphImage() {
  const { title, description } = seoConfig

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
          color: "#f8fafc",
          padding: "80px",
          fontFamily: "Geist, Geist Sans, Inter, Arial, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 500,
            marginBottom: 24,
            opacity: 0.8,
            textTransform: "uppercase",
            letterSpacing: 10,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 90,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          {description}
        </span>
      </div>
    ),
    {
      ...size,
    },
  )
}
