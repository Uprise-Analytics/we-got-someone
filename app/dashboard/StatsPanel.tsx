import { changeLabel, type Delta, type WorkerStats } from '@/lib/worker-stats'

// The worker's own numbers on their dashboard. Server component: stats are loaded in page.tsx.

function Change({ d }: { d: Delta }) {
  const c = changeLabel(d)
  const color = c.dir > 0 ? 'text-green-600' : 'text-gray-400' // drops stay calm grey, not red
  return <p className={`text-[11px] font-medium mt-1 ${color}`}>{c.text}</p>
}

function Tile({ label, value, d, accent, sub }: { label: string; value: number; d: Delta; accent: string; sub?: string }) {
  return (
    <div className={`bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border-t-4 ${accent}`}>
      <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-2">{label}</p>
      {sub ? <p className="text-[11px] font-medium mt-1 text-green-600">{sub}</p> : <Change d={d} />}
    </div>
  )
}

// 28 daily bars: grey height = profile views, green dot on days a client made contact.
function Chart({ daily }: { daily: WorkerStats['daily'] }) {
  const W = 560, H = 120, gap = 4
  const bw = (W - gap * (daily.length - 1)) / daily.length
  const max = Math.max(1, ...daily.map(d => d.views))
  const label = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full h-auto" role="img" aria-label="Profile views per day for the last 4 weeks">
      {daily.map((d, i) => {
        const h = d.views ? Math.max(4, (d.views / max) * H) : 2
        const x = i * (bw + gap)
        const thisWeek = i >= daily.length - 7
        return (
          <g key={d.day}>
            <title>{`${label(d.day)}: ${d.views} view${d.views === 1 ? '' : 's'}${d.contacts ? `, ${d.contacts} contact${d.contacts === 1 ? '' : 's'}` : ''}`}</title>
            <rect x={x} y={H - h} width={bw} height={h} rx={3} fill={thisWeek ? '#1D294A' : '#C3CADB'} />
            {d.contacts > 0 && <circle cx={x + bw / 2} cy={H - h - 8} r={4.5} fill="#2DAB64" />}
          </g>
        )
      })}
      <text x={0} y={H + 20} fontSize={12} fill="#9AA3B5">{label(daily[0].day)}</text>
      <text x={W} y={H + 20} fontSize={12} fill="#9AA3B5" textAnchor="end">Today</text>
    </svg>
  )
}

export default function StatsPanel({ stats }: { stats: WorkerStats }) {
  const split = stats.contacts.now ? `${stats.whatsapp} WhatsApp · ${stats.calls} call${stats.calls === 1 ? '' : 's'}` : undefined
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your stats</p>
        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Last 7 days</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <Tile label="Profile views" value={stats.views.now} d={stats.views} accent="border-slate-300" />
        <Tile label="Client contacts" value={stats.contacts.now} d={stats.contacts} accent="border-green-500" sub={split} />
        <Tile label="Searches for you" value={stats.searches.now} d={stats.searches} accent="border-amber-400" />
      </div>

      {stats.searches.now > 0 && (
        <p className="text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-400 rounded-lg px-3 py-2.5 mb-5">
          {stats.searches.now} {stats.searches.now === 1 ? 'person' : 'people'} searched for <strong>{stats.topSearchedTrade}</strong> this week.
          A complete profile with photos and reviews wins those clients.
        </p>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Profile views, last 4 weeks</p>
      <Chart daily={stats.daily} />
      <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1 mb-4">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1D294A]" />This week</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" />A client contacted you</span>
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 pt-4 text-center">
        <div><p className="text-lg font-bold text-gray-900">{stats.allTime.views}</p><p className="text-[11px] text-gray-500">views all time</p></div>
        <div><p className="text-lg font-bold text-gray-900">{stats.allTime.contacts}</p><p className="text-[11px] text-gray-500">contacts all time</p></div>
        <div>
          <p className="text-lg font-bold text-gray-900">{stats.allTime.reviews ? <>{stats.allTime.rating} <span className="text-yellow-400">★</span></> : 0}</p>
          <p className="text-[11px] text-gray-500">{stats.allTime.reviews} review{stats.allTime.reviews === 1 ? '' : 's'}</p>
        </div>
      </div>
    </div>
  )
}
