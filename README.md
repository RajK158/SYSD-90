# Sysd 90 🚀

**A 90-day system design and DSA mastery tracker for students preparing for top tech interviews at Amazon, Google, Meta, Microsoft, and similar companies.**

Live app: _[your-vercel-url.vercel.app]_

---

## What is Sysd 90?

Sysd 90 is a structured productivity web app that helps CS students go from zero to interview-ready in 90 days by following a battle-tested 12-week roadmap. It combines:

- **12-week structured roadmap** — from networking basics to interview-ready system designs
- **Daily task tracking** — system design, DSA, practical, and revision tasks every day
- **Streak tracking** — GitHub-style contribution calendar with 70% completion threshold
- **DSA problem logger** — track all 150 NeetCode problems with topics, difficulty, and notes
- **12 system design case studies** — URL Shortener, Chat App, Social Feed, and 9 more
- **Mock interview logger** — track scores, what went well, and action items
- **Notes system** — capture learnings, mistakes, and insights by category
- **Resources library** — pre-loaded with 30+ curated resources
- **Portfolio tracker** — for your `system-design-interview-prep` GitHub repo
- **Interview Readiness Score** — a live 0–100 score across 5 tiers
- **Multi-user** — anyone can sign up and track their own journey

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Email + Google + GitHub OAuth) |
| Database | Supabase PostgreSQL with Row Level Security |
| Client State | React state + Supabase real-time queries |
| Icons | Lucide React |
| Fonts | Google Fonts — Inter + JetBrains Mono |
| Deployment | Vercel |

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/sysd-90.git
cd sysd-90
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to provision (~2 minutes)
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run Database Migrations

1. In Supabase dashboard → **SQL Editor**
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. You should see: `Success. No rows returned`

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google OAuth** → Create credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URI:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
6. Copy **Client ID** and **Client Secret**
7. In Supabase: **Authentication → Providers → Google** → Paste them

### 5. Set Up GitHub OAuth

1. Go to [GitHub.com → Settings → Developer Settings → OAuth Apps → New](https://github.com/settings/applications/new)
2. Application name: `Sysd 90`
3. Homepage URL: `https://your-app.vercel.app`
4. Callback URL:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
5. Copy **Client ID** and generate **Client Secret**
6. In Supabase: **Authentication → Providers → GitHub** → Paste them

### 6. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-Command Deploy

```bash
npx vercel
```

Or deploy via Vercel dashboard:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL
4. Deploy

### Update Supabase Auth URLs

After deploying, update Supabase:
1. **Authentication → URL Configuration**
2. Site URL: `https://your-app.vercel.app`
3. Redirect URLs: `https://your-app.vercel.app/**`

---

## App Structure

```
app/
├── page.tsx              # Public landing page
├── login/page.tsx        # Login (email + Google + GitHub)
├── signup/page.tsx       # Signup
├── auth/callback/        # OAuth callback
├── dashboard/page.tsx    # Main dashboard
├── roadmap/page.tsx      # 12-week roadmap
├── daily/page.tsx        # All 90 daily tasks
├── dsa/page.tsx          # DSA problem tracker
├── case-studies/page.tsx # System design case studies
├── mocks/page.tsx        # Mock interview logger
├── notes/page.tsx        # Notes system
├── resources/page.tsx    # Resources library
├── portfolio/page.tsx    # GitHub portfolio tracker
└── settings/page.tsx     # Settings + export/import
```

---

## The 12-Week Roadmap

| Month | Week | Focus |
|-------|------|-------|
| 1 | 1 | Internet, Networking & Backend Basics |
| 1 | 2 | Scalability Fundamentals |
| 1 | 3 | Databases from Scratch |
| 1 | 4 | Caching, CDNs & Performance |
| 2 | 5 | Message Queues & Async Processing |
| 2 | 6 | Consistency & Distributed Trade-offs |
| 2 | 7 | Observability & Production Thinking |
| 2 | 8 | Case Study: URL Shortener |
| 3 | 9 | Case Study: Social Media Feed |
| 3 | 10 | Case Study: Chat Application |
| 3 | 11 | Case Study: Video/Search/E-Commerce |
| 3 | 12 | Final Interview Readiness Week |

---

## Interview Readiness Score

| Score | Tier |
|-------|------|
| 0–20 | 🌱 Beginner |
| 21–40 | 🔨 Building |
| 41–60 | ⚡ Consistent |
| 61–80 | 🎯 Interview-Ready |
| 81–100 | 🚀 Peak Mode |

Score is calculated from:
- DSA problems solved (30 pts)
- Case study sections completed (25 pts)
- Mock interviews logged (20 pts)
- Current streak (15 pts)
- Weekly reviews completed (10 pts)

---

## Streak Logic

- A day counts toward your streak if **≥ 70% of daily tasks are completed**
- Streak calendar works like GitHub's contribution graph
- Flexible Mode: enables catch-up mode for missed days
- 3 streak freezes available per user

---

## Contributing

This is an open-source project. PRs welcome!

---

## License

MIT
