# WNBAShots.com — Project Documentation

> Live at [www.wnbashots.com](https://www.wnbashots.com)  
> Interactive shot zone charts for every WNBA player. 2026 season.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [API Routes](#api-routes)
6. [Data Flow](#data-flow)
7. [Seed Process](#seed-process)
8. [Deployment](#deployment)
9. [Domain & DNS](#domain--dns)
10. [Security](#security)
11. [Analytics & Monitoring](#analytics--monitoring)
12. [Skills Used](#skills-used)
13. [Weekly Ops Checklist](#weekly-ops-checklist)
14. [Known Constraints](#known-constraints)

---

## Project Overview

**WNBAShots** is a dark-themed, mobile-first basketball analytics tool built during the 2026 WNBA season opener. It visualizes per-player shot zones, shooting percentages, and prop bet leans using unofficial WNBA stats API data.

**Core features:**
- Shot zone heatmap (neon orange SVG court, D3-powered)
- Per-zone FG% with colored dot indicators
- Side-by-side player comparison (desktop + mobile)
- Live game ticker with date pin
- Parlay/prop analysis sidebar
- Zone filter chips (All / 3-Pointers / Paint / 🔥 Hot)
- Season stats cards (PPG, FG%, 3P%, AST, REB)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS + inline styles |
| Visualization | SVG + D3 scale/chromatic |
| Database | Vercel KV (Upstash Redis) |
| Hosting | Vercel |
| DNS | Cloudflare → Vercel |
| Analytics | Vercel Analytics (@vercel/analytics) |
| Data Source | stats.wnba.com (unofficial API) |

---

## Architecture

```
Browser
  └── www.wnbashots.com (Vercel Edge)
        ├── Next.js App Router (SSR/RSC)
        │     ├── page.js → ShotTracker.jsx
        │     │     ├── CourtChart.jsx (SVG court)
        │     │     ├── BettingInsights.jsx
        │     │     └── LiveTicker.jsx
        │     └── layout.js (metadata, Analytics)
        └── API Routes (/app/api/)
              ├── /players → KV: players:2026
              ├── /player/[id] → KV: player:{id}:2026
              ├── /schedule → KV: schedule:today:2026
              ├── /meta → KV: meta:lastUpdated
              └── /refresh → POST (CRON_SECRET auth) → seed trigger

Seed Script (local Mac only)
  └── scripts/seed.mjs
        ├── Fetches stats.wnba.com
        ├── Processes zone data
        └── Writes to Vercel KV via REST
```

---

## File Structure

```
/Users/raya/wnba-shot-tracker/
├── app/
│   ├── layout.js              # Root layout, SEO metadata, Analytics
│   ├── page.js                # Nav bar + LiveTicker + ShotTracker
│   ├── globals.css            # Dark theme base, 100dvh, scrollbar, touch fixes
│   └── api/
│       ├── players/route.js   # GET all players from KV
│       ├── player/[id]/route.js # GET single player zones+stats+shots
│       ├── schedule/route.js  # GET today's games from KV
│       ├── meta/route.js      # GET last updated timestamp
│       └── refresh/route.js   # POST endpoint (seed trigger, CRON_SECRET auth)
├── components/
│   ├── ShotTracker.jsx        # Main UI: sidebar, filters, compare mode
│   ├── CourtChart.jsx         # SVG half-court with zone dots + shot scatter
│   ├── LiveTicker.jsx         # Scrolling game ticker with date
│   └── BettingInsights.jsx    # Prop bet leans based on zone data
├── lib/
│   ├── wnba-api.js            # stats.wnba.com fetch helpers
│   └── zones.js               # Zone coordinate definitions
├── scripts/
│   └── seed.mjs               # Manual seed script (run from Mac only)
├── public/
│   └── og-image.png           # Social share image (1200×630)
├── docs/
│   └── WNBASHOTS-PROJECT.md   # This file
├── vercel.json                # Security headers config
├── next.config.mjs
└── tailwind.config.js
```

---

## API Routes

| Route | Method | Auth | Returns |
|---|---|---|---|
| `/api/players` | GET | None | Array of all players `[{id, name, team}]` |
| `/api/player/[id]` | GET | None | `{zones, stats, shots}` for player |
| `/api/schedule` | GET | None | `{games: [{away, home, time, channel, status}]}` |
| `/api/meta` | GET | None | `{lastUpdated}` timestamp |
| `/api/refresh` | POST | CRON_SECRET header | Triggers KV seed from WNBA API |

---

## Data Flow

```
stats.wnba.com
    │
    ▼ (blocked on server IPs — Mac only)
scripts/seed.mjs
    │
    ▼ POST to /api/refresh with CRON_SECRET
Vercel KV (Upstash Redis)
    │
    ├── players:2026           → list of all 172 players
    ├── player:{id}:2026       → zones + stats + shots per player
    ├── schedule:today:2026    → today's games
    └── meta:lastUpdated       → ISO timestamp
    │
    ▼
/api/* routes read from KV
    │
    ▼
React components render in browser
```

### KV Key Schema

```
players:2026                    → JSON array [{id, name, team}]
player:1628932:2026             → { zones: [...], stats: {...}, shots: [...] }
schedule:today:2026             → { games: [{away, home, time, channel, status}] }
meta:lastUpdated                → "2026-05-18T03:11:09.456Z"
```

---

## Seed Process

**Run from Mac terminal only** — stats.wnba.com blocks server/cloud IPs.

```bash
CRON_SECRET=wnba2026secret SITE_URL=https://www.wnbashots.com node scripts/seed.mjs
```

**Important notes:**
- Space required between env vars (no space = silent auth failure)
- Always use `www.wnbashots.com` not `wnbashots.com` (apex 307-redirects, POST doesn't follow)
- Takes ~10 minutes for 172 players
- Watch for: `Done: { refreshed: 172, timestamp: '...' }`
- Run after each game night to refresh stats + shot data

**Zapier reminder:** Weekly Monday email set up to prompt manual seed run.

---

## Deployment

**Platform:** Vercel  
**Repo:** `rallums/wnba-shot-tracker`  
**Branch:** `pre-launch-fixes` → merge to `main` triggers deploy  
**Production URL:** `https://www.wnbashots.com`

### Vercel Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `CRON_SECRET` | `wnba2026secret` | Auth for /api/refresh POST |
| `NEXT_PUBLIC_SITE_URL` | `https://www.wnbashots.com` | Baked into build for OG metadataBase |
| `KV_REST_API_URL` | auto-set by Vercel KV | Upstash REST endpoint |
| `KV_REST_API_TOKEN` | auto-set by Vercel KV | Upstash auth token |

---

## Domain & DNS

**Registrar:** Cloudflare (wnbashots.com)  
**DNS:** Cloudflare → Vercel (auto-connect via Vercel integration)

| Record | Value |
|---|---|
| `www.wnbashots.com` | → Vercel (production) |
| `wnbashots.com` (apex) | → 307 redirects to www |

**Critical:** Apex `wnbashots.com` does a 307 redirect to `www`. POST requests don't follow 307. Always use `https://www.wnbashots.com` as SITE_URL in seed command.

### Social Share / OG

- Image: `/public/og-image.png` (1200×630px)
- Force X/Twitter to re-scrape: `cards-dev.twitter.com/validator` → paste URL → Check

---

## Security

- **CRON_SECRET**: timing-safe comparison in `/api/refresh` auth
- **Security headers** in `vercel.json`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- **No secrets in git**: `.env` not committed, all secrets in Vercel dashboard
- **Input validation**: player IDs validated before KV lookup
- Full security practices: `docs/security-practices.md`

---

## Analytics & Monitoring

**Vercel Analytics** — enabled, collecting from deploy  
View: Vercel dashboard → project → Analytics tab

**Upstash KV stats:**
- Storage: 326 KB / 256 MB (free tier)
- Commands: ~5.7K / 500K per month
- Endpoint: `enhanced-toad-123291.upstash.io`

**Vercel Logs:** dashboard → Logs tab → filter 5xx errors

---

## Skills Used

### ui-ux-pro-max
**Source:** `github.com/nextlevelbuilder/ui-ux-pro-max-skill`  
**Installed at:** `.claude/skills/ui-ux-pro-max/`

A BM25 + regex hybrid search engine across UI/UX databases (styles, colors, typography, UX guidelines, chart types).

**Search command:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> --stack nextjs -n 5
```

**Domains:** `product` `style` `typography` `color` `landing` `chart` `ux`

**Applied to this project:**
- Queried `mobile touch bottom navigation tab bar` → UX domain
  - Result: 44×44px min touch targets → applied to all buttons
  - Result: `touch-action: manipulation` → removes 300ms tap delay
  - Result: `overscroll-behavior: contain` → prevents pull-to-refresh
- Queried `dark sports analytics dashboard` → color domain
  - Validated existing dark palette against Financial Dashboard pattern (`#0F172A` bg, green CTAs)

---

## Weekly Ops Checklist

| Category | Check | How |
|---|---|---|
| Data | Seed ran after game nights | Terminal shows `Done: { refreshed: 172 }` |
| Data | Ticker shows today's games | Visit site before tip-off |
| Uptime | Site loads desktop + mobile | Visit www.wnbashots.com |
| Uptime | No 5xx errors | Vercel → Logs → filter 5xx |
| Analytics | Collecting pageviews | Vercel → Analytics tab |
| KV | Storage within limits | Upstash console → Details |
| Security | /api/refresh returns 401 without token | `curl -X POST https://www.wnbashots.com/api/refresh` |
| Domain | SSL valid, www redirect works | Visit site, check padlock |

---

## Known Constraints

| Constraint | Detail | Workaround |
|---|---|---|
| stats.wnba.com blocks server IPs | Can't seed from Vercel/GitHub Actions | Run seed.mjs from Mac only |
| GitHub Actions workflows | Removed — would fail due to IP block | Mac cron or manual run |
| Shot data availability | Not all players have shot coordinate data | Shows "Shot tracking not available for this player" |
| KV free tier | 500K commands/month, 256MB storage | Currently at 1% usage — no concern |
| Apex redirect | wnbashots.com → www is 307 | Always use www in SITE_URL |
| X card cache | X caches OG previews | Use cards-dev.twitter.com/validator to force refresh |

---

*Last updated: May 2026*
