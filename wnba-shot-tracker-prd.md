# WNBA Shot Tracker — PRD

## Problem
WNBA has no publicly available shot chart visualization tool. NBA fans have nba.com/stats, Cleaning the Glass, PBPStats. WNBA fans — especially the massive wave of new fans from 2024–26 — have nothing comparable. Data exists. Nobody built the UI.

## Target Users
- **New WNBA fans** (post-Caitlin Clark boom) who want to understand players visually
- **Fantasy WNBA players** — growing fast, no good tooling
- **Sports media / journalists** — need embeddable charts, shareable visuals
- **Coaches / scouts** — if tool gets traction

## Success Metric
5,000 DAU within 60 days of launch. Measured by: unique sessions, return visits, share events.

---

## Core Features (MVP)

### 1. Shot Zone Chart
- Half-court SVG visualization
- Zones: paint, mid-range, corner 3, wing 3, top of key, deep 3
- Bubble size = shot frequency in that zone
- Bubble color = FG% efficiency (blue=cold → red=hot)
- Filter: All / Made / Missed / Hot Zones / 3PT only / Paint only

### 2. Player Search & Select
- Search any active WNBA player (2026 roster ~144 players)
- Autocomplete dropdown
- Switch player → court re-renders

### 3. Filters
- 2026 season only (no season selector needed at MVP)
- Game range (all, last 5, last 10)
- Home/Away split
- Quarter filter (Q1–Q4, OT)

### 4. Sidebar Stats
- Season averages: PPG, FG%, 3P%, AST, REB, 3PA
- Zone efficiency breakdown with hot/cold tags vs league average
- League leaders leaderboard (3P%, FG%, PPG)

### 5. Compare Mode
- Side-by-side two players on split court
- Biggest viral feature — shareable screenshot

---

## Phase 2 (Post-MVP)

| Feature | Why |
|---|---|
| Team shot chart | Shows team tendencies, great for game previews |
| Game-by-game chart | "Clark's best shooting game of 2026" |
| Trend charts | FG% over last N games — shows hot/cold streaks |
| Embed widget | Media sites can embed player charts |
| Share / export | PNG download, Twitter card meta |
| League heat map | All players combined — shows where WNBA scores from |

---

## Tech Stack

### Frontend
- **Next.js** (App Router) — SEO matters for player name searches
- **D3.js** — court SVG + zone rendering
- **Tailwind CSS** — styling
- **Vercel** — hosting (free tier covers MVP traffic)

### Data Layer
```
WNBA Stats API (unofficial, same as NBA Stats API)
Base: https://stats.wnba.com/stats/

Key endpoints:
- shotchartdetail     → x/y coordinates per shot
- playercareerstats   → season averages
- leaguedashplayerstats → league leaders
- commonallplayers    → player list + team

No API key required. Add headers:
  Referer: https://www.wnba.com
  User-Agent: Mozilla/5.0...
```

### Data Strategy — Monday Auto-Refresh

Data updates every Monday automatically. No on-demand API calls in production — site always reads from cache.

**Flow:**
```
Every Monday 6am ET
  → Cron triggers /api/refresh
  → Fetch all player shot data from WNBA Stats API
  → Aggregate into zone JSON per player
  → Write to Vercel KV (key: player:{id}:2026)
  → Site reads from KV — always instant, always fresh
```

**Implementation options (pick one):**

Option A — Vercel Cron (simplest, requires Vercel Pro $20/mo):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/refresh",
    "schedule": "0 10 * * 1"
  }]
}
```

Option B — GitHub Actions (free):
```yaml
# .github/workflows/refresh.yml
on:
  schedule:
    - cron: '0 10 * * 1'  # Every Monday 10am UTC
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger refresh
        run: curl -X POST ${{ secrets.REFRESH_URL }} -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Option C — cron-job.org (free external service):
- Point to `https://yoursite.com/api/refresh?secret=XXX`
- Schedule: every Monday 6am ET
- No infra cost

**Recommended: Option B** (GitHub Actions) — free, version-controlled, reliable.

**Cache keys:**
```
player:{id}:shots:2026       → zone bubble data
player:{id}:stats:2026       → season averages
league:leaders:3p:2026       → leaderboard
meta:last_updated            → timestamp shown in UI ("Updated Mon May 12")
```

**Fallback:** if Monday fetch fails, keep previous week's cache. Never show empty state — stale data beats broken UI.

**"Updated Mondays" badge** shown in sidebar header. Displays last refresh date pulled from `meta:last_updated`.

---

## Build Order

### Week 1 — Foundation
- [ ] Next.js project setup + Vercel deploy
- [ ] WNBA API wrapper (fetch + cache layer)
- [ ] Pull shot data for 1 player, confirm x/y coordinates
- [ ] Static court SVG (half court, accurate dimensions)
- [ ] Plot raw shot dots on court

### Week 2 — Core Viz
- [ ] Convert shot dots → zone aggregation (group by court zone)
- [ ] Render zone bubbles (size=frequency, color=FG%)
- [ ] Color scale function (blue→red based on FG%)
- [ ] Glow filter on hot zones
- [ ] Made/Missed/All filter toggle

### Week 3 — UI Shell
- [ ] Nav (aipolicymap-style dark header)
- [ ] Left sidebar: stat cards, zone list, leaderboard
- [ ] Player search + autocomplete (pull from commonallplayers)
- [ ] Season / game filters wired to API params
- [ ] Mobile responsive (sidebar collapses to bottom sheet)

### Week 4 — Polish + Launch
- [ ] Compare mode (split court, 2 players)
- [ ] Share image (html2canvas or og:image API)
- [ ] SEO: `/player/caitlin-clark` routes with og:image
- [ ] Error states, loading skeletons
- [ ] Soft launch: post to WNBA Reddit, Twitter/X

---

## Court Coordinate System

WNBA stats API returns shot coordinates in tenths of feet from basket:
```
Basket = (0, 0)
x: negative = left, positive = right
y: positive = toward half court

Map to SVG (500×460 viewBox):
  svg_x = 250 + (api_x * 0.9)
  svg_y = 412 - (api_y * 0.9)   ← basket at y=412 in SVG
```

WNBA court: 94×50 ft. Half court = 47×50 ft.
3pt line radius: 22.1 ft = 221px at 10px/ft scale.

---

## Zone Definitions

```javascript
const ZONES = [
  { id: 'paint',      label: 'Paint',       xRange: [-60,60],   yRange: [-10,190] },
  { id: 'corner_l',   label: 'Corner 3 L',  xRange: [-250,-190], yRange: [-10,90] },
  { id: 'corner_r',   label: 'Corner 3 R',  xRange: [190,250],  yRange: [-10,90] },
  { id: 'wing_l',     label: 'Wing 3 L',    xRange: [-250,-80], yRange: [90,200]  },
  { id: 'wing_r',     label: 'Wing 3 R',    xRange: [80,250],   yRange: [90,200]  },
  { id: 'top_key',    label: 'Top of Key',  xRange: [-80,80],   yRange: [160,280] },
  { id: 'mid_l',      label: 'Mid-Range L', xRange: [-190,-60], yRange: [60,190]  },
  { id: 'mid_r',      label: 'Mid-Range R', xRange: [60,190],   yRange: [60,190]  },
  { id: 'deep_3',     label: 'Deep 3',      xRange: [-250,250], yRange: [260,400] },
]
```

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WNBA API goes down / rate limits | Cache aggressively, fallback to static JSON |
| API returns incomplete data for older seasons | Show "data unavailable" state gracefully |
| Low traffic | Launch with influencer / media hook — Caitlin Clark comparison screenshot is the viral mechanic |
| WNBA blocks API access | Mirror ESPN API or scrape wnba.com (last resort) |

---

## Launch Strategy
1. Build Clark vs Ionescu compare screenshot → post to X/Twitter with `#WNBA`
2. Submit to r/WNBAcom and r/basketball
3. DM 3 WNBA journalists with embeddable link
4. Add `og:image` per player so every shared URL auto-generates a shot chart card

---

## Timeline
| Phase | Duration |
|---|---|
| MVP (solo dev) | 4 weeks |
| Phase 2 features | 4–6 weeks |
| Stable v1.0 | ~10 weeks total |
