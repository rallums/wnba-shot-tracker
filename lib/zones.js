// WNBA API returns LOC_X / LOC_Y in tenths of feet, basket at (0,0)
// SVG viewBox 500x460, basket at svg (250, 412)
// Mapping: svg_x = 250 + (LOC_X * 0.9),  svg_y = 412 - (LOC_Y * 0.9)

export const ZONES = [
  { id: 'paint',    label: 'Paint',       xRange: [-80,  80],   yRange: [-10, 190] },
  { id: 'corner_l', label: 'Corner 3 L',  xRange: [-250,-190],  yRange: [-10,  90] },
  { id: 'corner_r', label: 'Corner 3 R',  xRange: [ 190, 250],  yRange: [-10,  90] },
  { id: 'wing_l',   label: 'Wing 3 L',    xRange: [-250, -80],  yRange: [90,  200] },
  { id: 'wing_r',   label: 'Wing 3 R',    xRange: [  80, 250],  yRange: [90,  200] },
  { id: 'top_key',  label: 'Top of Key',  xRange: [ -80,  80],  yRange: [160, 290] },
  { id: 'mid_l',    label: 'Mid-Range L', xRange: [-190, -80],  yRange: [60,  190] },
  { id: 'mid_r',    label: 'Mid-Range R', xRange: [  80, 190],  yRange: [60,  190] },
  { id: 'deep_3',   label: 'Deep 3',      xRange: [-250, 250],  yRange: [270, 420] },
]

// SVG center point per zone for bubble placement
export const ZONE_CENTERS = {
  paint:    { x: 250, y: 370 },
  corner_l: { x: 42,  y: 418 },
  corner_r: { x: 458, y: 418 },
  wing_l:   { x: 95,  y: 290 },
  wing_r:   { x: 405, y: 290 },
  top_key:  { x: 250, y: 195 },
  mid_l:    { x: 165, y: 275 },
  mid_r:    { x: 335, y: 275 },
  deep_3:   { x: 250, y: 158 },
}

function getZoneId(x, y) {
  return ZONES.find(z =>
    x >= z.xRange[0] && x <= z.xRange[1] &&
    y >= z.yRange[0] && y <= z.yRange[1]
  )?.id
}

export function aggregateShots(shots) {
  const acc = {}
  ZONES.forEach(z => { acc[z.id] = { ...z, attempts: 0, makes: 0 } })

  shots.forEach(({ LOC_X, LOC_Y, SHOT_MADE_FLAG }) => {
    const id = getZoneId(LOC_X, LOC_Y)
    if (!id) return
    acc[id].attempts++
    if (SHOT_MADE_FLAG === 1) acc[id].makes++
  })

  const maxAttempts = Math.max(...Object.values(acc).map(z => z.attempts), 1)

  return Object.values(acc)
    .filter(z => z.attempts > 0)
    .map(z => ({
      ...z,
      fgPct: z.makes / z.attempts,
      center: ZONE_CENTERS[z.id],
      radius: attemptsToRadius(z.attempts, maxAttempts),
      color: fgToColor(z.makes / z.attempts),
    }))
}

// Maps leaguedashplayershotlocations row → zone bubbles for CourtChart
// Verify column names match Friday night with the curl command in README
export function rowToZones(row) {
  const raw = [
    { id: 'paint',    label: 'Paint',       fgm: row.RA_FGM,    fga: row.RA_FGA,    fgPct: row.RA_FG_PCT    },
    { id: 'mid_l',    label: 'Mid-Range',   fgm: row.MR_FGM,    fga: row.MR_FGA,    fgPct: row.MR_FG_PCT    },
    { id: 'corner_l', label: 'Corner 3 L',  fgm: row.LC3_FGM,   fga: row.LC3_FGA,   fgPct: row.LC3_FG_PCT   },
    { id: 'corner_r', label: 'Corner 3 R',  fgm: row.RC3_FGM,   fga: row.RC3_FGA,   fgPct: row.RC3_FG_PCT   },
    { id: 'top_key',  label: 'Above Break', fgm: row.AB3_FGM,   fga: row.AB3_FGA,   fgPct: row.AB3_FG_PCT   },
  ].filter(z => z.fga > 0)

  const maxAttempts = Math.max(...raw.map(z => z.fga), 1)

  return raw.map(z => ({
    ...z,
    center: ZONE_CENTERS[z.id],
    radius: attemptsToRadius(z.fga, maxAttempts),
    color: fgToColor(z.fgPct),
  }))
}

export function fgToColor(pct) {
  if (pct < 0.28) return '#3a86ff'
  if (pct < 0.35) return '#4cc9f0'
  if (pct < 0.42) return '#f8b500'
  if (pct < 0.50) return '#f77f00'
  return '#c0392b'
}

export function attemptsToRadius(attempts, maxAttempts) {
  return Math.max(7, Math.min(22, 7 + (attempts / maxAttempts) * 15))
}
