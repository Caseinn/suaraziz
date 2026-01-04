// components/header.tsx
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import SignOutDialog from "@/components/sign-out-dialog"
import { Session } from "next-auth"
import MobileSearch from "@/components/header/mobile-search"

export default async function Header() {
  const session: Session | null = await getServerSession(authOptions)
  const user = session?.user

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="h-16 flex items-center gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-lg sm:text-xl tracking-tight text-foreground hover:text-primary transition"
            >
              <Image
                src="/logo.webp"
                alt="SuarAziz"
                width={32}
                height={32}
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                priority
              />
              <span>SuarAziz</span>
            </Link>
          </div>

          {/* Right side: search + auth */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <MobileSearch />
            {/* Desktop search (right, beside auth) */}
            <form
              action="/search"
              method="get"
              className="hidden md:flex items-center gap-2"
              role="search"
            >
              <Input
                name="q"
                type="search"
                placeholder="Search the archive"
                aria-label="Search the archive"
                className="h-10 w-56 sm:w-64 lg:w-72 bg-input/50 text-sm sm:text-base"
              />
              <input type="hidden" name="page" value="1" />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-10 rounded-full border-border/70 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] px-3 sm:px-4"
              >
                Search
              </Button>
            </form>

            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Open user menu"
                    className="flex items-center justify-center rounded-full border border-border/80 bg-card/60 hover:border-primary/60 transition w-9 h-9 overflow-hidden"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={36}
                        height={36}
                        loading="lazy"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-56 p-2 bg-card/95">
                  <div className="mb-2">
                    <div className="truncate text-sm font-medium">
                      {user.name ?? "User"}
                    </div>
                    {user.email && (
                      <div className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border-t border-border/70 pt-2 space-y-1">
                    <Link
                      href="/profile"
                      className="block w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent"
                    >
                      Profile
                    </Link>
                    <SignOutDialog>
                      <button className="block w-full px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-accent">
                        Sign out
                      </button>
                    </SignOutDialog>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button asChild size="sm" className="rounded-full px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-primary/40 via-transparent to-secondary/40" />
    </header>
  )
}
