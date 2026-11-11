import Link from 'next/link'
import type { WorkerStats } from '@/lib/worker-stats'

// The worker's own numbers on their dashboard (last 4 weeks). Server component: stats are loaded in page.tsx.
// Rule: never show a big zero. Zero tiles are swapped for the next positive number, and a worker with
// nothing to show yet gets a "get your first views" card instead of empty stats.

type TileData = { label: string; value: string; sub?: string; accent: string }

function Tile({ label, value, sub, accent }: TileData) {
  return (
    <div className={`bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border-t-4 ${accent}`}>
      <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-2">{label}</p>
      {sub && <p className="text-[11px] font-medium mt-1 text-green-600">{sub}</p>}
    </div>
  )
}

// 28 daily bars: height = profile views, green dot on days a client made contact.
function Chart({ daily }: { daily: WorkerStats['daily'] }) {
  const W = 560, H = 110, gap = 4
  const bw = (W - gap * (daily.length - 1)) / daily.length
  const max = Math.max(1, ...daily.map(d => d.views))
  const label = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full h-auto" role="img" aria-label="Profile views per day for the last 4 weeks">
      {daily.map((d, i) => {
        const h = d.views ? Math.max(4, (d.views / max) * H) : 2
        const x = i * (bw + gap)
        return (
          <g key={d.day}>
            <title>{`${label(d.day)}: ${d.views} view${d.views === 1 ? '' : 's'}${d.contacts ? `, ${d.contacts} contact${d.contacts === 1 ? '' : 's'}` : ''}`}</title>
            <rect x={x} y={H - h} width={bw} height={h} rx={3} fill={d.views ? '#1D294A' : '#E3E7EF'} />
            {d.contacts > 0 && <circle cx={x + bw / 2} cy={H - h - 8} r={4.5} fill="#2DAB64" />}
          </g>
        )
      })}
      <text x={0} y={H + 20} fontSize={12} fill="#9AA3B5">{label(daily[0].day)}</text>
      <text x={W} y={H + 20} fontSize={12} fill="#9AA3B5" textAnchor="end">Today</text>
    </svg>
  )
}

function GetFirstViews() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your stats</p>
      <p className="font-semibold text-gray-900 mb-1">Let&apos;s get your first views</p>
      <p className="text-sm text-gray-500 mb-4">Your numbers will show here as soon as clients start finding you. These get you seen fastest:</p>
      <ol className="space-y-2.5 text-sm text-gray-700">
        <li className="flex gap-2.5"><span className="w-5 h-5 flex-shrink-0 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">1</span>Share your profile link on your WhatsApp status (button at the bottom of this page).</li>
        <li className="flex gap-2.5"><span className="w-5 h-5 flex-shrink-0 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">2</span>Ask a past client to leave you a review. Reviewed profiles show higher in search.</li>
        <li className="flex gap-2.5"><span className="w-5 h-5 flex-shrink-0 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">3</span><span>Add work photos and every suburb you work in. <Link href="/dashboard/edit" className="text-green-600 font-semibold">Update my profile</Link></span></li>
      </ol>
    </div>
  )
}

export default function StatsPanel({ stats }: { stats: WorkerStats }) {
  const a = stats.allTime
  const hasAnything = stats.views.now > 0 || stats.contacts.now > 0 || stats.searches.now > 0 || a.views > 0
  if (!hasAnything) return <GetFirstViews />

  // Best three non-zero numbers, in order of importance.
  const candidates: (TileData & { n: number })[] = [
    { n: stats.contacts.now, label: 'Client contacts', value: String(stats.contacts.now), accent: 'border-green-500',
      sub: stats.calls ? `${stats.whatsapp} WhatsApp · ${stats.calls} call${stats.calls === 1 ? '' : 's'}` : undefined },
    { n: stats.views.now, label: 'Profile views', value: String(stats.views.now), accent: 'border-slate-400' },
    { n: stats.searches.now, label: `Searches for ${stats.topSearchedTrade ?? 'your trade'}`, value: String(stats.searches.now), accent: 'border-amber-400' },
    { n: a.views, label: 'Views all time', value: String(a.views), accent: 'border-slate-300' },
    { n: a.contacts, label: 'Contacts all time', value: String(a.contacts), accent: 'border-green-300' },
    { n: a.reviews, label: `${a.reviews} review${a.reviews === 1 ? '' : 's'}`, value: `${a.rating}★`, accent: 'border-yellow-400' },
  ]
  const tiles = candidates.filter(c => c.n > 0).slice(0, 3)
  const anyViews28 = stats.daily.some(d => d.views > 0)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your stats</p>
        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Last 4 weeks</span>
      </div>

      <div className={`grid gap-2 sm:gap-3 mb-5 ${tiles.length === 3 ? 'grid-cols-3' : tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {tiles.map(t => <Tile key={t.label} {...t} />)}
      </div>

      {stats.searches.now > 0 && (
        <p className="text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-400 rounded-lg px-3 py-2.5 mb-5">
          {stats.searches.now} {stats.searches.now === 1 ? 'person' : 'people'} searched for <strong>{stats.topSearchedTrade}</strong> in the last 4 weeks.
          A complete profile with photos and reviews wins those clients.
        </p>
      )}

      {anyViews28 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Profile views per day</p>
          <Chart daily={stats.daily} />
          {stats.daily.some(d => d.contacts > 0) && (
            <p className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600" />A client contacted you that day
            </p>
          )}
        </>
      )}
    </div>
  )
}
