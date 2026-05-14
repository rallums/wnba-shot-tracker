'use client'

export default function BettingInsights({ stats, zones }) {
  if (!stats) {
    return (
      <div className="p-4 border-t border-gray-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">📊 Betting Leans</div>
        <div className="text-[11px] text-gray-400 italic">Select a player to see prop leans</div>
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
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">📊 Betting Leans</span>
        {lowSample && (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            ⚠ {gp}GP
          </span>
        )}
      </div>
      <div className="space-y-2">
        {props.map(p => {
          const tagCls = p.lean === 'OVER'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                       : p.lean === 'UNDER' ? 'bg-red-50 text-red-700 border-red-200'
                       :                       'bg-gray-50 text-gray-400 border-gray-200'
          return (
            <div key={p.name} className="bg-white border border-gray-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-gray-900">{p.name}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${tagCls}`}>
                  {p.lean === 'OVER' ? '↑ OVER' : p.lean === 'UNDER' ? '↓ UNDER' : '— PASS'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-500">Suggested {p.line}</span>
                <span className="text-[12px] font-bold text-gray-900">{p.avg}<span className="text-[10px] text-gray-400 font-normal"> avg</span></span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{p.reason}</div>
            </div>
          )
        })}
      </div>
      <div className="text-[9px] text-gray-400 italic mt-3 leading-tight">
        Educational only — based on season averages and zone efficiency. Not financial advice.
      </div>
    </div>
  )
}
