"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function MobileSearch() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden rounded-full border-border/70"
          aria-label="Open search"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border/70 bg-card/95">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Search the archive</DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Find a track to review.
          </DialogDescription>
        </DialogHeader>

        <form action="/search" method="get" className="space-y-3">
          <Input
            name="q"
            type="search"
            placeholder="Search by artist, song, or album"
            aria-label="Search the archive"
            className="h-11 bg-input/40"
            autoFocus
          />
          <input type="hidden" name="page" value="1" />
          <Button
            type="submit"
            className="w-full h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] uppercase tracking-[0.3em]"
          >
            Search
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
