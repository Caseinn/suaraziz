// components/home/home-screen.tsx
import { Hero } from "@/components/home/hero"
import { Trending } from "@/components/home/trending"
import { FeaturedReviews } from "@/components/home/featured-review"

export function HomeScreen() {
  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 relative">
      <Hero />
      <section className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] items-start">
        <FeaturedReviews />
        <Trending />
      </section>
    </div>
  )
}
