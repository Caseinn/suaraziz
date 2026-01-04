// components/footer.tsx
import Link from "next/link"
import Image from "next/image"
import { Instagram, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border/80 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 text-[11px] sm:text-xs text-muted-foreground">
        
        {/* Left content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="SuarAziz"
              width={28}
              height={28}
              className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
            />
            <p className="font-display text-foreground text-[11px] sm:text-xs uppercase tracking-[0.4em]">
              SuarAziz
            </p>
          </div>

          <p className="max-w-xs">
            Archival listening notes, reviews, and annotations from the community.
          </p>

          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
            Caseinn {new Date().getFullYear()}
          </p>
        </div>

        {/* Right / Social media */}
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <Link
            href="https://instagram.com/ditorifkii"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border/70 hover:border-primary hover:text-primary transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </Link>

          <Link
            href="https://github.com/Caseinn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border/70 hover:border-primary hover:text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </footer>
  )
}
