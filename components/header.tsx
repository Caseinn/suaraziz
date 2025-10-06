// components/header.tsx
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import SignOutDialog from "@/components/sign-out-dialog"
import { Session } from "next-auth"

export default async function Header() {
  const session: Session | null = await getServerSession(authOptions)
  const user = session?.user

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto h-16 max-w-7xl px-4 md:px-8 flex items-center justify-between">
        {/* Left: Brand */}
        <Link
          href="/"
          className="font-bold text-lg text-primary hover:opacity-90 transition"
        >
          SuaraAziz
        </Link>

        {/* Right: Avatar or Sign In */}
        <div className="flex items-center gap-2">
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Open user menu"
                  className="flex items-center justify-center rounded-full border hover:opacity-90 transition w-8 h-8 overflow-hidden"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? "User"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-56 p-2">
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

                <div className="mt-2 border-t pt-2 space-y-1">
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
            <Button asChild size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}