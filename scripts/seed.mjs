// Run from your Mac: node scripts/seed.mjs
// WNBA API blocks server IPs but works from local machine

const BASE = 'https://stats.wnba.com/stats'
const SEASON = '2026'
const SITE_URL = process.env.SITE_URL || 'https://wnba-shot-tracker-947a.vercel.app'
const CRON_SECRET = process.env.CRON_SECRET || 'wnba2026secret'

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

async function fetchWNBA(endpoint, params) {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) throw new Error(`${endpoint} returned ${res.status}`)
  return res.json()
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

console.log('Posting to Vercel...')
const res = await fetch(`${SITE_URL}/api/refresh`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ allZones, leaders, players }),
})
const result = await res.json()
console.log('Done:', result)
