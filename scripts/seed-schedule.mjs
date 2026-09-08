// Fetch ONLY the season schedule and write to KV.
// Use when the full seed succeeded but scheduleleaguev2 timed out.
// Run: npm run seed:schedule

import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'

const SEASON = '2026'
const BASE = 'https://stats.wnba.com/stats'

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
]
function findChrome() {
  const found = CHROME_PATHS.find(existsSync)
  if (found) return found
  throw new Error('Chrome not found — install Google Chrome')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

console.log('Launching browser...')
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || findChrome(),
  protocolTimeout: 300000,
})
const page = await browser.newPage()
await page.setUserAgent(
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
)
await page.setExtraHTTPHeaders({
  'Accept-Language': 'en-US,en;q=0.9',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
})
await page.goto('https://stats.wnba.com/', { waitUntil: 'domcontentloaded', timeout: 60000 })

try {
  console.log('Fetching schedule...')
  let schedule = []
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const url = `${BASE}/scheduleleaguev2?LeagueID=10&Season=${SEASON}`
      const sb = await page.evaluate(async (fetchUrl) => {
        const res = await fetch(fetchUrl, {
          headers: {
            Accept: 'application/json, text/plain, */*',
            'x-nba-stats-origin': 'stats',
            'x-nba-stats-token': 'true',
          },
          signal: AbortSignal.timeout(60000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      }, url)

      const gameDates = sb.leagueSchedule?.gameDates || []
      for (const gd of gameDates) {
        const [datePart] = gd.gameDate.split(' ')
        const [mm, dd, yyyy] = datePart.split('/')
        const dateISO = `${yyyy}-${mm}-${dd}`
        for (const g of (gd.games || [])) {
          const away = g.awayTeam?.teamTricode || '—'
          const home = g.homeTeam?.teamTricode || '—'
          const status = g.gameStatus === 2 ? 'live' : g.gameStatus === 3 ? 'final' : 'upcoming'
          const broadcasters = g.broadcasters?.nationalBroadcasters?.map(b => b.broadcasterDisplay).join(', ')
            || g.broadcasters?.homeTvBroadcasters?.map(b => b.broadcasterDisplay).join(', ')
            || 'WNBA League Pass'
          schedule.push({
            date: dateISO, away, home,
            time: g.gameStatusText?.trim() || 'TBD',
            channel: broadcasters, status,
          })
        }
      }
      console.log(`Got ${schedule.length} games`)
      break
    } catch (e) {
      console.log(`  Attempt ${attempt} failed: ${e.message}`)
      if (attempt < 4) await sleep(3000 * attempt)
      else throw e
    }
  }

  const { kv } = await import('@vercel/kv')
  await kv.set('schedule:season:2026', schedule, { ex: 60 * 60 * 24 * 60 })
  console.log(`Done: stored ${schedule.length} games in schedule:season:2026`)
} finally {
  await browser?.close()
}
