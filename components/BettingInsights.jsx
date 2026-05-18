'use client'

export default function BettingInsights({ stats, zones }) {
  if (!stats) {
    return (
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#777' }}>📊 Parlay Analysis</div>
        <div className="text-[11px] italic" style={{ color: '#777' }}>Select a player to see prop leans</div>
      </div>
    )
  }

  const paint = zones.find(z => z.id === 'paint')
  const threes = zones.filter(z => ['corner_l','corner_r','top_key'].includes(z.id))
  const threeAtt = threes.reduce((s, z) => s + (z.fga || 0), 0)
  const threePct = threeAtt ? threes.reduce((s, z) => s + (z.fgPct || 0) * (z.fga || 0), 0) / threeAtt : 0
  const gp = stats.GP || 0
  const lowSample = gp < 5

  const ptsLine  = Math.max(0, +(stats.PTS - 0.5).toFixed(1))
  const fg3mLine = Math.max(0, +((stats.FG3M ?? 0) - 0.5).toFixed(1))
  const astLine  = Math.max(0, +((stats.AST  ?? 0) - 0.5).toFixed(1))
  const rebLine  = Math.max(0, +((stats.REB  ?? 0) - 0.5).toFixed(1))

  const props = [
    {
      name: 'Points',
      line: ptsLine, avg: stats.PTS?.toFixed(1) ?? '—',
      lean: stats.PTS > 14 && (paint?.fgPct > 0.45 || threePct > 0.36) ? 'OVER'
          : stats.PTS < 7 ? 'UNDER' : 'PASS',
      reason: paint?.fgPct > 0.50 ? `${Math.round(paint.fgPct*100)}% in paint`
            : threePct > 0.38 ? `${Math.round(threePct*100)}% from 3`
            : `${stats.FG_PCT ? (stats.FG_PCT*100).toFixed(0) : '—'}% FG`,
    },
    {
      name: '3-Pointers Made',
      line: fg3mLine, avg: (stats.FG3M ?? 0).toFixed(1),
      lean: threePct > 0.36 && threeAtt > 3 ? 'OVER'
          : threePct < 0.28 || threeAtt < 1 ? 'UNDER' : 'PASS',
      reason: threeAtt > 0 ? `${(threePct*100).toFixed(0)}% on ${threeAtt.toFixed(1)} 3PA/g` : 'No 3PT volume',
    },
    {
      name: 'Assists',
      line: astLine, avg: (stats.AST ?? 0).toFixed(1),
      lean: stats.AST > 5 ? 'OVER' : stats.AST < 1.5 ? 'UNDER' : 'PASS',
      reason: 'Season avg basis',
    },
    {
      name: 'Rebounds',
      line: rebLine, avg: (stats.REB ?? 0).toFixed(1),
      lean: stats.REB > 6 ? 'OVER' : stats.REB < 2.5 ? 'UNDER' : 'PASS',
      reason: 'Season avg basis',
    },
  ]

  return (
    <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#777' }}>📊 Parlay Analysis</span>
        {lowSample && (
          <span title="Small sample — only a few games played; stats may be unreliable"
            className="text-[9px] font-bold px-1.5 py-0.5 rounded cursor-help"
            style={{ color: '#f59e0b', background: '#f59e0b15' }}>
            ⚠ {gp} games
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {props.map(p => {
          const isOver = p.lean === 'OVER', isUnder = p.lean === 'UNDER'
          return (
            <div key={p.name} className="rounded-lg p-2.5"
              style={{ background: '#161616', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold" style={{ color: '#bbb' }}>{p.name}</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: isOver ? '#22c55e15' : isUnder ? '#ef444415' : '#1e1e1e',
                    color: isOver ? '#22c55e' : isUnder ? '#ef4444' : '#333'
                  }}>
                  {isOver ? '↑ OVER' : isUnder ? '↓ UNDER' : '— PASS'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px]" style={{ color: '#bbb' }}>Line {p.line}</span>
                <span className="text-[11px] font-black" style={{ color: '#f0f0f0' }}>{p.avg}<span className="text-[10px] font-normal" style={{ color: '#bbb' }}> avg</span></span>
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#777' }}>{p.reason}</div>
            </div>
          )
        })}
      </div>
      <div className="text-[9px] italic mt-3 leading-tight" style={{ color: '#2a2a2a' }}>
        Educational only. Not financial advice.
      </div>
    </div>
  )
}
