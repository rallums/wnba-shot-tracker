const BASE = 'https://stats.wnba.com/stats'
const SEASON = '2026'

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.wnba.com',
  'Referer': 'https://www.wnba.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
}

async function fetchWNBA(endpoint, params = {}) {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: HEADERS,
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`WNBA API ${endpoint} returned ${res.status}`)

  const data = await res.json()
  const { headers, rowSet } = data.resultSets[0]
  return rowSet.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])))
}

export async function getShotChart(playerId) {
  return fetchWNBA('shotchartdetail', {
    PlayerID: playerId,
    Season: SEASON,
    SeasonType: 'Regular Season',
    TeamID: 0,
    GameID: '',
    ContextMeasure: 'FGA',
    LeagueID: '10',
  })
}

export async function getPlayerStats(playerId) {
  const rows = await fetchWNBA('playercareerstats', {
    PlayerID: playerId,
    PerMode: 'PerGame',
    LeagueID: '10',
  })
  return rows.find(r => r.SEASON_ID === SEASON) ?? rows.at(-1)
}

export async function getAllPlayers() {
  return fetchWNBA('commonallplayers', {
    LeagueID: '10',
    Season: SEASON,
    IsOnlyCurrentSeason: 1,
  })
}

export async function getLeagueLeaders() {
  return fetchWNBA('leaguedashplayerstats', {
    Season: SEASON,
    SeasonType: 'Regular Season',
    PerMode: 'PerGame',
    LeagueID: '10',
    MeasureType: 'Base',
    Scope: 'S',
    LastNGames: 0,
    Month: 0,
    OpponentTeamID: 0,
    PaceAdjust: 'N',
    PlusMinus: 'N',
    Rank: 'N',
  })
}

// leaguedashplayershotlocations returns resultSets as an object (not array)
// with nested 2-row headers. Parse manually using fixed column indices.
const ZONE_PREFIXES = ['RA', 'ITP', 'MR', 'LC3', 'RC3', 'AB3', 'BC', 'C3']

async function fetchZoneShooting(params = {}) {
  const url = new URL(`${BASE}/leaguedashplayershotlocations`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: HEADERS,
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`WNBA API leaguedashplayershotlocations returned ${res.status}`)

  const data = await res.json()
  const { rowSet } = data.resultSets

  return rowSet.map(row => {
    const obj = {
      PLAYER_ID: row[0],
      PLAYER_NAME: row[1],
      TEAM_ID: row[2],
      TEAM_ABBREVIATION: row[3],
      AGE: row[4],
      NICKNAME: row[5],
    }
    ZONE_PREFIXES.forEach((prefix, i) => {
      const base = 6 + i * 3
      obj[`${prefix}_FGM`] = row[base]
      obj[`${prefix}_FGA`] = row[base + 1]
      obj[`${prefix}_FG_PCT`] = row[base + 2]
    })
    return obj
  })
}

// Returns zone FG% for ALL players in one call — use this for Monday refresh
// Zones: RA, ITP, MR, LC3, RC3, AB3, BC, C3
export async function getAllZoneShooting() {
  return fetchZoneShooting({
    College: '',
    Conference: '',
    Country: '',
    DateFrom: '',
    DateTo: '',
    DistanceRange: 'By Zone',
    Division: '',
    DraftPick: '',
    DraftYear: '',
    GameScope: '',
    GameSegment: '',
    Height: '',
    LastNGames: 0,
    LeagueID: '10',
    Location: '',
    MeasureType: 'Base',
    Month: 0,
    OpponentTeamID: 0,
    Outcome: '',
    PORound: 0,
    PaceAdjust: 'N',
    PerMode: 'PerGame',
    Period: 0,
    PlayerExperience: '',
    PlayerPosition: '',
    PlusMinus: 'N',
    Rank: 'N',
    Season: SEASON,
    SeasonSegment: '',
    SeasonType: 'Regular Season',
    ShotClockRange: '',
    StarterBench: '',
    TeamID: 0,
    VsConference: '',
    VsDivision: '',
    Weight: '',
  })
}
