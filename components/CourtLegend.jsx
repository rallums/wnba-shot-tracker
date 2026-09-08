'use client'

export default function CourtLegend({ view }) {
  if (view === 'zones') {
    return (
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-wnba-muted px-2 py-2"
        aria-label="Zone chart legend"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-wnba-orange opacity-90" aria-hidden />
          Bubble size = shot attempts per game
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-wnba-orange ring-2 ring-white/25" aria-hidden />
          Label = FG% in zone
        </span>
        <span>Orange = hotter shooting</span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-wnba-muted px-2 py-2"
      aria-label="Shot chart legend"
    >
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-green-600" aria-hidden />
        Made
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-red-500 font-bold" aria-hidden>×</span>
        Missed
      </span>
    </div>
  )
}
