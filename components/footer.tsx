// components/footer.tsx
import Link from "next/link"
import { Instagram, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t mt-auto py-6 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Brand */}
        <p className="font-medium text-foreground/80 whitespace-nowrap">
          🎵 SuaraAziz © {new Date().getFullYear()}
        </p>

        {/* Right: Social icons */}
        <div className="flex items-center gap-4">
          <Link
            href="https://instagram.com/ditorifkii"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-primary transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </Link>

          <Link
            href="https://github.com/Caseinn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
