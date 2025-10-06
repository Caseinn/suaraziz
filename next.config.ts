import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },                  // album & artist images
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },// some profile images
      { protocol: "https", hostname: "mosaic.scdn.co" },             // playlist mosaics (optional)
    ],
  },
}

export default nextConfig
