// components/home/types.ts
export type Item = {
  id: string
  name: string
  artists: string[]
  album: string
  image?: string
}

export type FeaturedItem = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string
  author: { id: string; name: string; image?: string | null }
  track: { id: string; name: string; artists: string[]; album: string; image?: string }
}
