# SuarAziz — A Collective Listening Journal

**[Live App](https://suaraziz.vercel.app/)** | **[GitHub Repository](https://github.com/caseinn/suaraziz)**

A **community-driven music archive** for documenting *how* and *why* a song resonates — built as a **listening journal**, not a recommendation engine.

> 🎧 **Human context over metrics** — We don’t count plays. We preserve thoughts, timestamps, and personal meaning.

---

## 🎧 Purpose & Vision

**SuarAziz** (from *Suara Aziz* — *Aziz’s Voice*) is designed for listeners who believe music is more than numbers.  
It exists to capture **memory, emotion, and personal interpretation**, rather than technical critique or algorithmic popularity.

Songs often mark moments: late nights, long rides, quiet breakthroughs.  
SuarAziz preserves those moments — **in words**, not statistics.

> **Core Philosophy**  
> *“We do not track what you stream. We archive why a song stayed with you.”*

---

## ✨ Key Features

- **Track-Centric Archive**  
  Every song has a dedicated page aggregating reviews, ratings, and discussion.

- **Personal Music Reviews**  
  Authenticated users can write reflective reviews with ratings (1–5), titles, and timestamps.

- **Community Interaction**  
  Like and comment on reviews — minimal, respectful, and rate-limited.

- **Private & Public Profiles**  
  Track your listening history privately or share your public archive without exposing personal data.

- **Search & Discovery**  
  Spotify-powered search with cached persistence for long-term access.

- **Trending Shelf**  
  Weekly global charts supplemented with local engagement data for resilience.

---

## 🧪 How It Works

1. A user searches for a track (Spotify API).
2. Track metadata is **cached locally** via Prisma for persistence.
3. Users submit reviews (plain text, whitespace-preserved).
4. Ratings are visualized using custom components:
   - **GrooveBars** for individual ratings
   - **GrooveMeter** for aggregated averages
5. Community interactions (likes, comments) update instantly via revalidation.

No auto-play. No recommendations.  
Only **intentional listening records**.

---

## 🧩 Core Modules

### 🎵 Track Pages
- Spotify metadata (cached)
- Aggregated reviews
- Average rating visualization
- Comment threads

### 👤 User Profiles
- **Private Profile** (`/profile`)
  - Full review history
  - Favorites (5/5 tracks)
  - Personal statistics
- **Public Profile** (`/user/[id]`)
  - Same data, no email exposure
  - Public-facing listening archive

### 💬 Social Layer
- Likes and comments (rate-limited)
- No follows, no feeds, no virality mechanics

---

## 🎨 Design & Experience

- **Dark-first interface** focused on readability and calm attention
- Color system:
  - Primary: `#cbff00` (electric lime)
  - Secondary: `#2e5bff` (vibrant blue)
  - Background: `#0d0d0d`
- Card-based layouts with subtle blur and gradient accents
- Fully responsive — optimized for reflective reading on mobile

Every UI choice is made to **stay out of the way of the words**.

---

## 🔒 Security & Reliability

- **Authentication**: Google OAuth via NextAuth.js
- **Session Handling**: Database-backed sessions (Prisma)
- **Rate Limiting**: Per-user & per-IP using Upstash Redis
- **CSRF & Origin Protection**: Strict origin validation on all mutations
- **Input Validation**: Length and format enforcement across all inputs
- **Instant Revalidation**: `revalidatePath()` for real-time updates

Built to be **quiet, resilient, and abuse-resistant**.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Authentication**: NextAuth.js + Google OAuth
- **Database**: MongoDB + Prisma ORM
- **Caching & Rate Limit**: Upstash Redis
- **Styling**: Tailwind CSS with custom theme system
- **Utilities**:
  - `lucide-react` (icons)
  - `sonner` (toasts)
  - `cheerio` (chart scraping fallback)
- **Deployment**: Vercel-ready (with proxy trust support)

---

## 🌐 SEO & Metadata

- Dynamic OpenGraph images (`next/og`)
- JSON-LD structured data
- Auto-generated `sitemap.xml` and `robots.txt`
- Full Twitter & OpenGraph metadata support

---

## 🚫 What SuarAziz Is *Not*

- Not a streaming service
- Not a recommendation algorithm
- Not a social network
- Not a critic or editorial platform

There are no follows, DMs, or engagement loops.  
Only **intentional expression**.

---

## 💡 Why SuarAziz Exists

Music often accompanies the most personal parts of our lives — but those moments disappear into algorithms.

SuarAziz exists to **slow listening down** and preserve its meaning.

> Think of it as a **collective diary of listening experiences** —  
> written by humans, for humans.

---

## 📄 License

MIT License — feel free to use, remix, or adapt for personal or activist projects.

> Created by **[Dito Rifki Irawan](https://instagram.com/ditorifkii)** (@caseinn)  
> 🎧 For listeners who remember *why* a song mattered

---

## ❤️ Support

If you find this project meaningful:
- ⭐ Star the repo
- 🔗 Follow [@ditorifkii on Instagram](https://instagram.com/ditorifkii) or explore more on [GitHub @caseinn](https://github.com/caseinn)

---

*Listen deeply. Write honestly. Archive meaning.*
