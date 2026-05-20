// Run from your Mac: node scripts/seed.mjs
// WNBA API blocks server IPs but works from local machine

const BASE = 'https://stats.wnba.com/stats'
const SEASON = '2026'
const SITE_URL = process.env.SITE_URL || 'https://wnba-shot-tracker-947a.vercel.app'
if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET env var required — run: CRON_SECRET=yourSecret node scripts/seed.mjs')
const CRON_SECRET = process.env.CRON_SECRET

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.wnba.com',
  'Referer': 'https://www.wnba.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
}

const ZONE_PREFIXES = ['RA', 'ITP', 'MR', 'LC3', 'RC3', 'AB3', 'BC', 'C3']

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchWNBA(endpoint, params, retries = 3) {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 12000)
      const res = await fetch(url.toString(), { headers: HEADERS, signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) return res.json()
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (i + 1))
        continue
      }
      throw new Error(`${endpoint} returned ${res.status}`)
    } catch (e) {
      if (i === retries - 1) throw e
      await sleep(2000 * (i + 1))
    }
  }
}

console.log('Fetching zone shooting data...')
const zoneData = await fetchWNBA('leaguedashplayershotlocations', {
  College:'',Conference:'',Country:'',DateFrom:'',DateTo:'',
  DistanceRange:'By Zone',Division:'',DraftPick:'',DraftYear:'',
  GameScope:'',GameSegment:'',Height:'',LastNGames:0,LeagueID:'10',
  Location:'',MeasureType:'Base',Month:0,OpponentTeamID:0,Outcome:'',
  PORound:0,PaceAdjust:'N',PerMode:'PerGame',Period:0,
  PlayerExperience:'',PlayerPosition:'',PlusMinus:'N',Rank:'N',
  Season:SEASON,SeasonSegment:'',SeasonType:'Regular Season',
  ShotClockRange:'',StarterBench:'',TeamID:0,VsConference:'',VsDivision:'',Weight:'',
})

const allZones = zoneData.resultSets.rowSet.map(row => {
  const obj = {
    PLAYER_ID: row[0], PLAYER_NAME: row[1], TEAM_ID: row[2],
    TEAM_ABBREVIATION: row[3], AGE: row[4], NICKNAME: row[5],
  }
  ZONE_PREFIXES.forEach((prefix, i) => {
    const base = 6 + i * 3
    obj[`${prefix}_FGM`] = row[base]
    obj[`${prefix}_FGA`] = row[base + 1]
    obj[`${prefix}_FG_PCT`] = row[base + 2]
  })
  return obj
})
console.log(`Got ${allZones.length} players`)

console.log('Fetching league leaders...')
const leaderData = await fetchWNBA('leaguedashplayerstats', {
  Season:SEASON,SeasonType:'Regular Season',PerMode:'PerGame',
  LeagueID:'10',MeasureType:'Base',Scope:'S',LastNGames:0,
  Month:0,OpponentTeamID:0,PaceAdjust:'N',PlusMinus:'N',Rank:'N',
  College:'',Conference:'',Country:'',DateFrom:'',DateTo:'',
  Division:'',DraftPick:'',DraftYear:'',GameScope:'',GameSegment:'',
  Height:'',Location:'',Outcome:'',PORound:0,Period:0,
  PlayerExperience:'',PlayerPosition:'',SeasonSegment:'',
  ShotClockRange:'',StarterBench:'',TeamID:0,TwoWay:0,
  VsConference:'',VsDivision:'',Weight:'',
})
const { headers, rowSet } = leaderData.resultSets[0]
const leaders = rowSet.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])))
console.log(`Got ${leaders.length} leaders`)

const players = allZones.map(r => ({
  id: r.PLAYER_ID, name: r.PLAYER_NAME,
  team: r.TEAM_ABBREVIATION, abbr: r.TEAM_ABBREVIATION,
}))

console.log('Fetching shot charts per player...')
const shotsByPlayer = {}
const playerIds = allZones.map(p => p.PLAYER_ID)
const BATCH = 2
for (let i = 0; i < playerIds.length; i += BATCH) {
  if (i > 0) await sleep(600)
  const batch = playerIds.slice(i, i + BATCH)
  const results = await Promise.all(batch.map(async pid => {
    try {
      const data = await fetchWNBA('shotchartdetail', {
        PlayerID: pid, Season: SEASON, SeasonType: 'Regular Season',
        TeamID: 0, GameID: '', ContextMeasure: 'FGA', LeagueID: '10',
        AheadBehind: '', ClutchTime: '', DateFrom: '', DateTo: '',
        EndPeriod: 10, EndRange: 28800, GameSegment: '', LastNGames: 0,
        Location: '', Month: 0, OpponentTeamID: 0, Outcome: '',
        Period: 0, PointDiff: '', Position: '', RangeType: 0,
        RookieYear: '', SeasonSegment: '', StartPeriod: 1, StartRange: 0,
        VsConference: '', VsDivision: '',
      })
      const h = data.resultSets[0].headers
      const ix = h.indexOf('LOC_X'), iy = h.indexOf('LOC_Y'), im = h.indexOf('SHOT_MADE_FLAG')
      return { id: pid, shots: data.resultSets[0].rowSet.map(r => ({ x: r[ix], y: r[iy], m: r[im] === 1 ? 1 : 0 })) }
    } catch {
      return { id: pid, shots: [] }
    }
  }))
  results.forEach(r => shotsByPlayer[r.id] = r.shots)
  process.stdout.write(`\r  ${Math.min(i+BATCH, playerIds.length)}/${playerIds.length}`)
}
console.log('')

// Full season schedule
console.log('Fetching full season schedule...')
let seasonSchedule = []
try {
  const sb = await fetchWNBA('scheduleleaguev2', { LeagueID: '10', Season: SEASON })
  const gameDates = sb.leagueSchedule?.gameDates || []
  for (const gd of gameDates) {
    // parse "05/14/2026 00:00:00" → "2026-05-14"
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
      seasonSchedule.push({
        date: dateISO, away, home,
        time: g.gameStatusText?.trim() || 'TBD',
        channel: broadcasters, status,
      })
    }
  }
  console.log(`  Got ${seasonSchedule.length} games for ${SEASON} season`)
} catch (e) {
  console.log(`  Season schedule fetch failed: ${e.message} (continuing)`)
}
const schedule = seasonSchedule

console.log('Posting to Vercel...')
const res = await fetch(`${SITE_URL}/api/refresh`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ allZones, leaders, players, shotsByPlayer, schedule }),
})
const result = await res.json()
console.log('Done:', result)
