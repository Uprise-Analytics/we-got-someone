import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Only these accounts can open /admin. Everyone else gets a 404.
export const OWNER_EMAILS = [
  'juanlee11@gmail.com',
  'juan-lee@upriseanalytics.co.za',
  'info@upriseanalytics.co.za',
]

export function isOwnerEmail(email?: string | null) {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase())
}

export async function getOwner() {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await serverSupabase.auth.getUser()
  return user && isOwnerEmail(user.email) ? user : null
}

// ── Data for the dashboard ──────────────────────────────────────────────────

const DAY = 86400000
const SA_OFFSET = 2 * 3600000 // South Africa is UTC+2 all year

export function dayKey(date: string | number | Date) {
  return new Date(new Date(date).getTime() + SA_OFFSET).toISOString().slice(0, 10)
}

type Event = {
  type: 'page_view' | 'profile_view' | 'whatsapp_tap' | 'search'
  created_at: string
  visitor_id: string | null
  session_id: string | null
  path: string | null
  worker_id: string | null
  trade: string | null
  area: string | null
  results: number | null
  referrer: string | null
  utm_source: string | null
  device: string | null
}

export type AttentionLevel = 'critical' | 'warning' | 'info'
export type Attention = { level: AttentionLevel; text: string; nudge: string }

export type WorkerRow = {
  id: string
  name: string
  firstName: string
  skills: string[]
  areas: string[]
  phone: string | null
  waNumber: string | null
  email: string | null
  photo: string | null
  joined: string
  lastSignIn: string | null
  live: boolean
  isOwner: boolean
  health: number
  viewsAll: number
  tapsAll: number
  viewsPeriod: number
  tapsPeriod: number
  reviews: number
  rating: number
  attention: Attention[]
}

export type Delta = { now: number; before: number }

function waNumber(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('27')) return digits
  if (digits.startsWith('0')) return '27' + digits.slice(1)
  return digits
}

function firstName(name: string) {
  const clean = name.trim()
  if (/\b(pty|ltd|cc|services|solutions|removals|gates|doors|analytics|love|and)\b|&|\(/i.test(clean)) return ''
  const first = clean.split(/\s+/)[0] ?? ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

async function allEvents(since: Date) {
  const rows: Event[] = []
  for (let from = 0; from < 200000; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .select('type, created_at, visitor_id, session_id, path, worker_id, trade, area, results, referrer, utm_source, device')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + 999)
    if (error || !data?.length) break
    rows.push(...(data as Event[]))
    if (data.length < 1000) break
  }
  return rows
}

// True when the reviewer's name matches the worker's own name, e.g. "Wynne" reviewing "Wynne".
function isSelfReview(reviewer: string, worker: string) {
  const norm = (s: string) => (s ?? '').toLowerCase().replace(/[^a-z ]/g, '').trim()
  const a = norm(reviewer), b = norm(worker)
  return !!a && !!b && (a === b || b.startsWith(a + ' ') || a.startsWith(b + ' '))
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined) {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) map.set(k, (map.get(k) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function pageLabel(path: string) {
  const p = path.split('?')[0]
  if (p === '/') return 'Home'
  if (p.startsWith('/workers/')) return 'Worker profiles'
  if (p === '/workers') return 'Search results'
  if (p.startsWith('/find/')) return 'Service pages (/find)'
  if (p.startsWith('/join')) return 'Join (sign-up)'
  if (p.startsWith('/dashboard')) return 'Worker dashboard'
  if (p.startsWith('/sign-in')) return 'Sign in'
  if (p.startsWith('/for-workers')) return 'For workers'
  if (p.startsWith('/contact')) return 'Contact'
  return p
}

function sourceLabel(e: Event) {
  if (e.utm_source) return e.utm_source.toLowerCase()
  const r = e.referrer
  if (!r) return 'direct'
  if (/google\./.test(r)) return 'google'
  if (/facebook|fb\.|m\.facebook|l\.facebook|lm\.facebook/.test(r)) return 'facebook'
  if (/instagram/.test(r)) return 'instagram'
  if (/whatsapp|wa\.me/.test(r)) return 'whatsapp'
  if (/bing\./.test(r)) return 'bing'
  return r
}

export async function loadDashboard(days: number) {
  const now = Date.now()
  const periodStart = new Date(now - days * DAY)
  const prevStart = new Date(now - 2 * days * DAY)

  const [workersRes, usersRes, leadsRes, messagesRes, events] = await Promise.all([
    supabaseAdmin
      .from('workers')
      .select('id, user_id, name, skills, city, service_areas, phone, email, photo_url, banner_url, bio, work_photos, is_active, profile_views, whatsapp_taps, created_at, reviews(rating, reviewer_name, comment, created_at)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from('leads').select('email, trade, area, utm_source, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('contact_messages').select('name, whatsapp, type, message, status, created_at').order('created_at', { ascending: false }).limit(20),
    allEvents(prevStart),
  ])

  const users = usersRes.data?.users ?? []
  const userById = new Map(users.map(u => [u.id, u]))
  const workersRaw = (workersRes.data ?? []) as any[]
  const leads = (leadsRes.data ?? []) as { email: string; trade: string | null; area: string | null; utm_source: string | null; created_at: string }[]
  const messages = (messagesRes.data ?? []) as { name: string; whatsapp: string; type: string; message: string; status: string; created_at: string }[]

  const inPeriod = events.filter(e => new Date(e.created_at) >= periodStart)
  const inPrev = events.filter(e => new Date(e.created_at) < periodStart)
  const of = (list: Event[], type: Event['type']) => list.filter(e => e.type === type)
  const unique = (list: Event[]) => new Set(list.map(e => e.visitor_id ?? e.session_id).filter(Boolean)).size
  const between = (date: string, start: Date, end: number) => {
    const t = new Date(date).getTime()
    return t >= start.getTime() && t < end
  }

  // ── Workers ──
  const periodByWorker = new Map<string, { views: number; taps: number }>()
  for (const e of inPeriod) {
    if (!e.worker_id) continue
    const w = periodByWorker.get(e.worker_id) ?? { views: 0, taps: 0 }
    if (e.type === 'profile_view') w.views++
    if (e.type === 'whatsapp_tap') w.taps++
    periodByWorker.set(e.worker_id, w)
  }
  const trackingSince = events[0]?.created_at ?? null
  const trackedLongEnough = !!trackingSince && now - new Date(trackingSince).getTime() >= Math.min(days, 7) * DAY

  const workers: WorkerRow[] = workersRaw.map(w => {
    const user = userById.get(w.user_id)
    const email = (w.email || user?.email || null) as string | null
    const reviews = (w.reviews ?? []) as { rating: number }[]
    const areas: string[] = w.service_areas?.length ? w.service_areas : w.city ? [w.city] : []
    const workPhotos = w.work_photos?.length ?? 0
    const lastSignIn = user?.last_sign_in_at ?? null
    const daysSinceSignIn = lastSignIn ? (now - new Date(lastSignIn).getTime()) / DAY : Infinity
    const daysSinceJoin = (now - new Date(w.created_at).getTime()) / DAY
    const live = !!w.is_active && !!w.photo_url
    const period = periodByWorker.get(w.id) ?? { views: 0, taps: 0 }
    const viewsAll = w.profile_views ?? 0
    const tapsAll = w.whatsapp_taps ?? 0

    const health = Math.round(
      (w.photo_url ? 25 : 0) +
      (w.bio?.trim() ? 15 : 0) +
      (workPhotos >= 3 ? 15 : workPhotos > 0 ? 8 : 0) +
      (w.banner_url ? 10 : 0) +
      (areas.length >= 3 ? 10 : areas.length > 0 ? 5 : 0) +
      (reviews.length >= 3 ? 15 : reviews.length > 0 ? 10 : 0) +
      (daysSinceSignIn <= 14 ? 10 : 0)
    )

    const attention: Attention[] = []
    if (!w.photo_url) attention.push({ level: 'critical', text: 'Hidden: no profile photo', nudge: 'your profile is hidden from search because it has no profile photo. Add one and you go live straight away' })
    else if (!w.is_active) attention.push({ level: 'critical', text: 'Profile switched off', nudge: 'your profile is not showing in search right now' })
    if (user && !user.email_confirmed_at) attention.push({ level: 'critical', text: 'Email not confirmed', nudge: 'your email address is not confirmed yet. Check your inbox for the link from us' })
    if (live && trackedLongEnough && daysSinceJoin > 3 && period.views === 0) attention.push({ level: 'warning', text: `No views in ${days} days`, nudge: 'nobody has looked at your profile lately. Share your profile link on WhatsApp and Facebook to get it moving' })
    if (viewsAll >= 10 && tapsAll === 0) attention.push({ level: 'warning', text: `${viewsAll} views, no contacts`, nudge: `${viewsAll} people looked at your profile but nobody messaged yet. Better photos of your work and a short bio help clients choose you` })
    if (!w.bio?.trim()) attention.push({ level: 'info', text: 'No bio', nudge: 'add a short bio so clients know who you are' })
    if (workPhotos === 0) attention.push({ level: 'info', text: 'No work photos', nudge: 'add a few photos of your work. Clients trust profiles with photos much more' })
    if (reviews.length === 0 && daysSinceJoin > 2) attention.push({ level: 'info', text: 'No reviews yet', nudge: 'send your profile link to past clients and ask for a quick review' })
    if (daysSinceSignIn > 14 && daysSinceJoin > 14) attention.push({ level: 'info', text: lastSignIn ? `Last signed in ${Math.round(daysSinceSignIn)} days ago` : 'Never signed in', nudge: 'we have not seen you in a while. Pop in and make sure your profile is up to date' })

    return {
      id: w.id,
      name: w.name?.trim() || 'No name',
      firstName: firstName(w.name ?? ''),
      skills: w.skills ?? [],
      areas,
      phone: w.phone,
      waNumber: waNumber(w.phone),
      email,
      photo: w.photo_url,
      joined: w.created_at,
      lastSignIn,
      live,
      isOwner: isOwnerEmail(email) || isOwnerEmail(user?.email),
      health,
      viewsAll,
      tapsAll,
      viewsPeriod: period.views,
      tapsPeriod: period.taps,
      reviews: reviews.length,
      rating: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0,
      attention,
    }
  })

  const realWorkers = workers.filter(w => !w.isOwner)
  const allReviews = workersRaw
    .flatMap(w => (w.reviews ?? []).map((r: any) => ({ ...r, worker: w.name?.trim(), workerId: w.id })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  // ── KPIs ──
  const signupsIn = (start: Date, end: number) => workersRaw.filter(w => between(w.created_at, start, end)).length
  const reviewsIn = (start: Date, end: number) => allReviews.filter(r => between(r.created_at, start, end)).length
  const kpis = {
    visitors: { now: unique(of(inPeriod, 'page_view')), before: unique(of(inPrev, 'page_view')) },
    profileViews: { now: of(inPeriod, 'profile_view').length, before: of(inPrev, 'profile_view').length },
    contacts: { now: of(inPeriod, 'whatsapp_tap').length, before: of(inPrev, 'whatsapp_tap').length },
    signups: { now: signupsIn(periodStart, now), before: signupsIn(prevStart, periodStart.getTime()) },
    reviews: { now: reviewsIn(periodStart, now), before: reviewsIn(prevStart, periodStart.getTime()) },
    live: realWorkers.filter(w => w.live).length,
    totalWorkers: realWorkers.length,
    allTimeViews: realWorkers.reduce((s, w) => s + w.viewsAll, 0),
    allTimeContacts: realWorkers.reduce((s, w) => s + w.tapsAll, 0),
    allTimeReviews: allReviews.length,
    activeToday: unique(of(events, 'page_view').filter(e => dayKey(e.created_at) === dayKey(now))),
  }

  // ── Daily series for the period ──
  const dayKeys: string[] = []
  for (let i = days - 1; i >= 0; i--) dayKeys.push(dayKey(now - i * DAY))
  const series = (fn: (key: string) => number) => dayKeys.map(k => ({ day: k, value: fn(k) }))
  const byDay = (list: Event[]) => {
    const map = new Map<string, Event[]>()
    for (const e of list) {
      const k = dayKey(e.created_at)
      map.set(k, [...(map.get(k) ?? []), e])
    }
    return map
  }
  const pvDays = byDay(of(inPeriod, 'page_view'))
  const viewDays = byDay(of(inPeriod, 'profile_view'))
  const tapDays = byDay(of(inPeriod, 'whatsapp_tap'))
  const daily = {
    visitors: series(k => unique(pvDays.get(k) ?? [])),
    profileViews: series(k => viewDays.get(k)?.length ?? 0),
    contacts: series(k => tapDays.get(k)?.length ?? 0),
    signups: series(k => workersRaw.filter(w => dayKey(w.created_at) === k).length),
    reviews: series(k => allReviews.filter(r => dayKey(r.created_at) === k).length),
  }

  // Growth since launch (sign-ups do not depend on tracking)
  const firstDay = workersRaw.length ? workersRaw.map(w => w.created_at).sort()[0] : new Date(now).toISOString()
  const growth: { day: string; value: number }[] = []
  let running = 0
  const sorted = [...workersRaw].sort((a, b) => a.created_at.localeCompare(b.created_at))
  for (let t = new Date(dayKey(firstDay)).getTime(); t <= now; t += DAY) {
    const k = dayKey(t)
    while (sorted.length && dayKey(sorted[0].created_at) <= k) { sorted.shift(); running++ }
    growth.push({ day: k, value: running })
  }

  // ── Funnel ──
  const userEmails = new Set(users.map(u => u.email?.toLowerCase()))
  const workerUserIds = new Set(workersRaw.map(w => w.user_id))
  const abandoned = leads.filter(l => !userEmails.has(l.email.toLowerCase()))
  const confirmedUsers = users.filter(u => u.email_confirmed_at)
  const noProfile = confirmedUsers.filter(u => !workerUserIds.has(u.id))
  const startedEmails = new Set([...leads.map(l => l.email.toLowerCase()), ...users.map(u => u.email?.toLowerCase())])
  const funnel = [
    { label: 'Started sign-up', value: startedEmails.size },
    { label: 'Created account', value: users.length },
    { label: 'Confirmed email', value: confirmedUsers.length },
    { label: 'Built a profile', value: workersRaw.length },
    { label: 'Live in search', value: workers.filter(w => w.live).length },
    { label: 'Got a WhatsApp contact', value: workers.filter(w => w.tapsAll > 0).length },
    { label: 'Got a review', value: workers.filter(w => w.reviews > 0).length },
  ]

  // ── Demand and supply ──
  const searches = of(inPeriod, 'search')
  const demandMap = new Map<string, { searches: number; empty: number; results: number }>()
  for (const s of searches) {
    if (!s.trade) continue
    const d = demandMap.get(s.trade) ?? { searches: 0, empty: 0, results: 0 }
    d.searches++
    d.results += s.results ?? 0
    if ((s.results ?? 0) === 0) d.empty++
    demandMap.set(s.trade, d)
  }
  const supplyBySkill = new Map<string, number>()
  for (const w of realWorkers.filter(w => w.live)) for (const s of w.skills) supplyBySkill.set(s, (supplyBySkill.get(s) ?? 0) + 1)
  const demand = [...demandMap.entries()]
    .map(([trade, d]) => ({ trade, searches: d.searches, empty: d.empty, supply: supplyBySkill.get(trade) ?? 0 }))
    .sort((a, b) => b.searches - a.searches)
  const supply = [...supplyBySkill.entries()].sort((a, b) => b[1] - a[1])
  const areaSupply = countBy(realWorkers.filter(w => w.live).flatMap(w => w.areas), a => a)
  const searchedAreas = countBy(searches, s => s.area)
  const emptySearches = countBy(searches.filter(s => (s.results ?? 0) === 0), s => [s.trade, s.area].filter(Boolean).join(' in '))

  // Profile views per service (what clients are actually looking at)
  const workerSkills = new Map(workers.map(w => [w.id, w.skills]))
  const viewsBySkill = countBy(of(inPeriod, 'profile_view').flatMap(e => (workerSkills.get(e.worker_id ?? '') ?? []).map(s => ({ s }))), x => x.s)

  // ── Traffic ──
  const sessions = new Map<string, Event>()
  for (const e of of(inPeriod, 'page_view')) {
    const k = e.session_id ?? e.visitor_id ?? ''
    if (k && !sessions.has(k)) sessions.set(k, e)
  }
  const firstHits = [...sessions.values()]
  const traffic = {
    sources: countBy(firstHits, sourceLabel),
    devices: countBy(firstHits, e => e.device),
    pages: countBy(of(inPeriod, 'page_view'), e => e.path && pageLabel(e.path)),
    sessions: sessions.size,
    pageViews: of(inPeriod, 'page_view').length,
  }

  // ── Activity feed ──
  const activity = [
    ...workersRaw.slice(0, 15).map(w => ({ at: w.created_at as string, kind: 'signup' as const, text: `${w.name?.trim()} joined`, flag: undefined as string | undefined, sub: (w.skills ?? []).slice(0, 2).join(', '), href: `/workers/${w.id}` })),
    ...allReviews.slice(0, 15).map(r => ({ at: r.created_at as string, kind: 'review' as const, text: `${r.reviewer_name} reviewed ${r.worker}`, flag: isSelfReview(r.reviewer_name, r.worker) ? 'Looks like a self-review' : undefined, sub: `${'★'.repeat(r.rating)}${r.comment ? ' · ' + r.comment.slice(0, 80) : ''}`, href: `/workers/${r.workerId}` })),
    ...of(events, 'whatsapp_tap').slice(-15).map(e => ({ at: e.created_at, kind: 'contact' as const, flag: undefined, text: `Someone WhatsApped ${workers.find(w => w.id === e.worker_id)?.name ?? 'a worker'}`, sub: e.device ?? '', href: `/workers/${e.worker_id}` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14)

  return {
    days,
    generatedAt: new Date(now).toISOString(),
    trackingSince,
    kpis,
    daily,
    growth,
    funnel,
    workers,
    abandoned,
    noProfile: noProfile.map(u => ({ email: u.email ?? '', created_at: u.created_at })),
    demand,
    supply,
    areaSupply,
    searchedAreas,
    emptySearches,
    viewsBySkill,
    searchCount: searches.length,
    traffic,
    activity,
    messages,
  }
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>
