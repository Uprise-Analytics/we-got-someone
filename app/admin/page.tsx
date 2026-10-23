import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getOwner, loadDashboard, type Delta } from '@/lib/admin'
import { BarList, Funnel, GrowthChart, Sparkline, TrafficChart } from './charts'
import WorkersTable from './WorkersTable'
import OwnerFlag from './OwnerFlag'
import SignOutButton from '../dashboard/SignOutButton'

export const metadata: Metadata = {
  title: 'Owner dashboard',
  robots: { index: false, follow: false },
}

const PERIODS = [7, 30, 90]

function fmtDate(date: string, withTime = false) {
  return new Date(date).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function ago(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function Change({ delta }: { delta: Delta }) {
  const { now, before } = delta
  if (!now && !before) return <span className="text-[11px] text-white/40">No data yet</span>
  if (!before) return <span className="text-[11px] font-semibold text-green-300">New</span>
  const pct = Math.round(((now - before) / before) * 100)
  const up = pct >= 0
  return (
    <span className={`text-[11px] font-semibold ${up ? 'text-green-300' : 'text-red-300'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% <span className="font-normal text-white/40">vs before</span>
    </span>
  )
}

function Card({ title, note, children, className = '' }: { title: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        {note && <div className="text-xs text-gray-400 text-right">{note}</div>}
      </div>
      {children}
    </section>
  )
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const owner = await getOwner()
  if (!owner) notFound()

  const { days: daysParam } = await searchParams
  const days = PERIODS.includes(Number(daysParam)) ? Number(daysParam) : 30
  const d = await loadDashboard(days)
  const k = d.kpis

  const trackingDays = d.trackingSince ? Math.ceil((new Date(d.generatedAt).getTime() - new Date(d.trackingSince).getTime()) / 86400000) : 0
  const attentionCount = d.workers.filter(w => !w.isOwner && w.attention.some(a => a.level !== 'info')).length
  const conversion = k.profileViews.now ? Math.round((k.contacts.now / k.profileViews.now) * 100) : 0

  const tiles = [
    { label: 'Visitors', value: k.visitors.now, delta: k.visitors, spark: d.daily.visitors, color: '#93c5fd' },
    { label: 'Profile views', value: k.profileViews.now, delta: k.profileViews, spark: d.daily.profileViews, color: '#93c5fd' },
    { label: 'WhatsApp contacts', value: k.contacts.now, delta: k.contacts, spark: d.daily.contacts, color: '#4ade80' },
    { label: 'New workers', value: k.signups.now, delta: k.signups, spark: d.daily.signups, color: '#4ade80' },
    { label: 'New reviews', value: k.reviews.now, delta: k.reviews, spark: d.daily.reviews, color: '#facc15' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerFlag />
      <Navbar variant="dashboard" profileHref="/dashboard" signOutSlot={
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden sm:inline text-sm text-gray-500 hover:text-gray-900">My profile</Link>
          <SignOutButton />
        </div>
      } />

      {/* ── Header and headline numbers ── */}
      <header className="bg-[#0D1B2A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Owner dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ textWrap: 'balance' }}>How We Got Someone is doing</h1>
              <p className="text-sm text-white/50 mt-1">
                Updated {fmtDate(d.generatedAt, true)}
                {attentionCount > 0 && <> · <a href="#workers" className="text-amber-300 hover:underline">{attentionCount === 1 ? '1 worker needs' : `${attentionCount} workers need`} attention</a></>}
              </p>
            </div>
            <nav className="flex bg-white/10 rounded-xl p-1 self-start sm:self-auto" aria-label="Time period">
              {PERIODS.map(p => (
                <Link
                  key={p}
                  href={`/admin?days=${p}`}
                  className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors ${p === days ? 'bg-white text-[#0D1B2A]' : 'text-white/70 hover:text-white'}`}
                >
                  {p} days
                </Link>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {tiles.map(t => (
              <div key={t.label} className="bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-col">
                <p className="text-xs text-white/60 font-medium">{t.label}</p>
                <p className="text-3xl font-extrabold tabular-nums mt-1 leading-none">{t.value}</p>
                <div className="mt-1.5 mb-2"><Change delta={t.delta} /></div>
                <div className="mt-auto"><Sparkline points={t.spark} color={t.color} /></div>
              </div>
            ))}
            <div className="bg-green-600 rounded-2xl p-4 flex flex-col col-span-2 lg:col-span-1">
              <p className="text-xs text-white/80 font-medium">Live profiles</p>
              <p className="text-3xl font-extrabold tabular-nums mt-1 leading-none">{k.live}<span className="text-lg text-white/60 font-bold"> / {k.totalWorkers}</span></p>
              <div className="mt-3 h-1.5 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${k.totalWorkers ? (k.live / k.totalWorkers) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-white/80 mt-2">{k.totalWorkers - k.live} hidden from search</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {trackingDays < days && (
          <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-2xl px-4 py-3">
            {d.trackingSince
              ? <>Visitor tracking started on {fmtDate(d.trackingSince)}, so visits, views and contacts only cover the last {trackingDays} day{trackingDays === 1 ? '' : 's'}. The charts fill in from here.</>
              : <>Visitor tracking is switched on. Visits, profile views and contacts show up here as soon as people use the site. Worker numbers and all-time totals are already complete.</>}
            {' '}Your own visits from this browser are not counted.
          </div>
        )}

        {/* ── Traffic over time ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card
            title={`Last ${days} days`}
            className="lg:col-span-2"
            note={
              <span className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#1D294A]" />Visitors</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-blue-400" />Profile views</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green-600" />WhatsApp contacts</span>
              </span>
            }
          >
            <TrafficChart visitors={d.daily.visitors} views={d.daily.profileViews} contacts={d.daily.contacts} />
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{d.traffic.pageViews}</p>
                <p className="text-xs text-gray-500">Pages viewed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{d.traffic.sessions ? (d.traffic.pageViews / d.traffic.sessions).toFixed(1) : '0'}</p>
                <p className="text-xs text-gray-500">Pages per visit</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{conversion}%</p>
                <p className="text-xs text-gray-500">Profile views that led to WhatsApp</p>
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Right now">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{k.activeToday}</p>
                  <p className="text-xs text-gray-500">Visitors today</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{k.allTimeContacts}</p>
                  <p className="text-xs text-gray-500">Contacts all time</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{k.allTimeViews}</p>
                  <p className="text-xs text-gray-500">Profile views all time</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{k.allTimeReviews}</p>
                  <p className="text-xs text-gray-500">Reviews all time</p>
                </div>
              </div>
            </Card>
            <Card title="Workers on the platform" note={`${k.totalWorkers} total`}>
              <GrowthChart points={d.growth} />
            </Card>
          </div>
        </div>

        {/* ── Workers ── */}
        <section id="workers" className="bg-white border border-gray-200 rounded-2xl p-5 scroll-mt-20">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your workers</h2>
            <p className="hidden sm:block text-xs text-gray-400">Profile score: photo, bio, work photos, cover, areas, reviews and recent sign-in</p>
          </div>
          <WorkersTable workers={d.workers} days={days} />
        </section>

        {/* ── Funnel and activity ── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Sign-up funnel" note="All time">
            <Funnel steps={d.funnel} />
            {(d.abandoned.length > 0 || d.noProfile.length > 0) && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">Started but never finished</p>
                <p className="text-xs text-gray-500 mb-3">These people typed their email on the join page but have no profile. A quick message often gets them over the line.</p>
                <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {[...d.abandoned.map(l => ({ email: l.email, at: l.created_at, note: 'Never created an account' })),
                    ...d.noProfile.map(u => ({ email: u.email, at: u.created_at, note: 'Confirmed email, no profile' }))].map(p => (
                    <li key={p.email} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="text-gray-800 truncate">{p.email}</p>
                        <p className="text-xs text-gray-400">{p.note} · {fmtDate(p.at)}</p>
                      </div>
                      <a
                        href={`mailto:${p.email}?subject=${encodeURIComponent('Finish your We Got Someone profile')}&body=${encodeURIComponent('Hi there,\n\nWe saw you started signing up on We Got Someone but did not finish. It only takes a few minutes and it is free. Clients in your area can then find you and WhatsApp you directly.\n\nFinish here: https://www.wegotsomeone.co.za/join\n\nIf anything gave you trouble, just reply to this email.\n\nThe We Got Someone team')}`}
                        className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg"
                      >
                        Email
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Latest activity">
            {d.activity.length === 0 ? <p className="text-sm text-gray-400">Nothing yet.</p> : (
              <ul className="space-y-3">
                {d.activity.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={`mt-1 w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${a.kind === 'signup' ? 'bg-[#1D294A] text-white' : a.kind === 'review' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {a.kind === 'signup' ? '+' : a.kind === 'review' ? '★' : 'W'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={a.href} className="text-sm font-medium text-gray-900 hover:text-green-700 line-clamp-1">{a.text}</Link>
                      {a.flag && <span className="inline-block text-[11px] font-semibold text-red-700 bg-red-50 ring-1 ring-red-100 px-1.5 py-0.5 rounded mb-0.5">{a.flag}</span>}
                      {a.sub && <p className="text-xs text-gray-500 line-clamp-1">{a.sub}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{ago(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Demand and supply ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card title="What clients search for" note={`${d.searchCount} searches`} className="lg:col-span-2">
            {d.demand.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">No searches recorded yet. As soon as people search by service or open a service page, it shows here, with how many workers they found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      <th className="py-2 font-semibold">Service</th>
                      <th className="py-2 font-semibold text-right">Searches</th>
                      <th className="py-2 font-semibold text-right">Found nobody</th>
                      <th className="py-2 font-semibold text-right">Live workers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.demand.slice(0, 12).map(r => (
                      <tr key={r.trade} className="border-b border-gray-50">
                        <td className="py-2.5 text-gray-800">
                          {r.trade}
                          {r.supply === 0 && <span className="ml-2 text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Recruit</span>}
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">{r.searches}</td>
                        <td className={`py-2.5 text-right tabular-nums ${r.empty ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>{r.empty}</td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700">{r.supply}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {d.emptySearches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-2">Searches that found nobody</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.emptySearches.slice(0, 16).map(([q, n]) => (
                    <span key={q} className="text-xs bg-red-50 text-red-700 ring-1 ring-red-100 px-2 py-1 rounded-full">{q} <b className="tabular-nums">{n}</b></span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Most viewed services">
            <BarList items={d.viewsBySkill.slice(0, 8)} empty="Shows which services clients open most, once profile views come in." color="bg-[#1D294A]" />
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card title="Live workers per service">
            <BarList items={d.supply.slice(0, 10)} empty="No live workers yet." />
          </Card>
          <Card title="Live workers per area">
            <BarList items={d.areaSupply.slice(0, 10)} empty="No areas set yet." />
          </Card>
          <Card title="Areas people search">
            <BarList items={d.searchedAreas.slice(0, 10)} empty="Shows once people search by area." color="bg-[#1D294A]" />
          </Card>
        </div>

        {/* ── Traffic ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card title="Where visitors come from" note={`${d.traffic.sessions} visits`}>
            <BarList items={d.traffic.sources.slice(0, 8)} empty="Shows once visitors arrive." color="bg-[#1D294A]" />
          </Card>
          <Card title="Devices">
            <BarList items={d.traffic.devices} empty="Shows once visitors arrive." color="bg-[#1D294A]" />
          </Card>
          <Card title="Top pages">
            <BarList items={d.traffic.pages.slice(0, 8)} empty="Shows once visitors arrive." color="bg-[#1D294A]" />
          </Card>
        </div>

        {d.messages.length > 0 && (
          <Card title="Contact form messages">
            <ul className="divide-y divide-gray-50">
              {d.messages.map((m, i) => (
                <li key={i} className="py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-gray-900">{m.name} <span className="font-normal text-gray-400">· {m.type}</span></p>
                    <span className="text-xs text-gray-400">{ago(m.created_at)}</span>
                  </div>
                  <p className="text-gray-600 mt-0.5">{m.message}</p>
                  {m.whatsapp && <p className="text-xs text-gray-400 mt-1">{m.whatsapp}</p>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 pb-6">Only you can see this page. It is hidden from Google and from everyone else.</p>
      </main>
    </div>
  )
}
