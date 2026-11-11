import { supabaseAdmin } from '@/lib/supabase-admin'

// One worker's own numbers, shared by their dashboard and their weekly email so both always agree.
// Server-only: analytics_events is readable by the service role only.

const DAY = 86400000
const SA_OFFSET = 2 * 3600000 // South Africa is UTC+2 all year

export function saDay(date: string | number | Date) {
  return new Date(new Date(date).getTime() + SA_OFFSET).toISOString().slice(0, 10)
}

export type Delta = { now: number; before: number }
export type WorkerStats = {
  views: Delta
  contacts: Delta
  whatsapp: number // this week
  calls: number // this week
  searches: Delta // people searching for one of the worker's trades in their areas (or anywhere)
  topSearchedTrade: string | null
  daily: { day: string; views: number; contacts: number }[] // last 28 days, oldest first
  allTime: { views: number; contacts: number; reviews: number; rating: number }
}

type WorkerInput = {
  id: string
  skills: string[] | null
  service_areas: string[] | null
  city: string | null
  profile_views: number | null
  whatsapp_taps: number | null
}

export async function getWorkerStats(w: WorkerInput, now = Date.now()): Promise<WorkerStats> {
  const weekStart = now - 7 * DAY
  const prevStart = now - 14 * DAY
  const chartStart = now - 28 * DAY
  const skills = w.skills ?? []
  const areas = new Set((w.service_areas?.length ? w.service_areas : w.city ? [w.city] : []).map(a => a.toLowerCase()))

  const [mine, calls, searches, reviews] = await Promise.all([
    supabaseAdmin.from('analytics_events').select('type, created_at')
      .eq('worker_id', w.id).in('type', ['profile_view', 'whatsapp_tap', 'call_tap'])
      .gte('created_at', new Date(chartStart).toISOString()).limit(5000),
    supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
      .eq('worker_id', w.id).eq('type', 'call_tap'),
    skills.length
      ? supabaseAdmin.from('analytics_events').select('trade, area, created_at')
          .eq('type', 'search').in('trade', skills)
          .gte('created_at', new Date(prevStart).toISOString()).limit(5000)
      : Promise.resolve({ data: [] as { trade: string; area: string | null; created_at: string }[] }),
    supabaseAdmin.from('reviews').select('rating').eq('worker_id', w.id),
  ])

  const events = mine.data ?? []
  const t = (e: { created_at: string }) => new Date(e.created_at).getTime()
  const isContact = (e: { type: string }) => e.type === 'whatsapp_tap' || e.type === 'call_tap'
  const inWeek = events.filter(e => t(e) >= weekStart)
  const inPrev = events.filter(e => t(e) >= prevStart && t(e) < weekStart)

  // A search counts when it was for one of their trades and either had no area or one of their areas.
  const relevant = (searches.data ?? []).filter(s => !s.area || areas.has(s.area.toLowerCase()))
  const sNow = relevant.filter(s => t(s) >= weekStart)
  const tradeCount = new Map<string, number>()
  for (const s of sNow) tradeCount.set(s.trade, (tradeCount.get(s.trade) ?? 0) + 1)
  const topSearchedTrade = [...tradeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const daily: WorkerStats['daily'] = []
  for (let i = 27; i >= 0; i--) {
    const day = saDay(now - i * DAY)
    const onDay = events.filter(e => saDay(e.created_at) === day)
    daily.push({ day, views: onDay.filter(e => e.type === 'profile_view').length, contacts: onDay.filter(isContact).length })
  }

  const ratings = (reviews.data ?? []).map(r => r.rating).filter(Boolean) as number[]
  return {
    views: { now: inWeek.filter(e => e.type === 'profile_view').length, before: inPrev.filter(e => e.type === 'profile_view').length },
    contacts: { now: inWeek.filter(isContact).length, before: inPrev.filter(isContact).length },
    whatsapp: inWeek.filter(e => e.type === 'whatsapp_tap').length,
    calls: inWeek.filter(e => e.type === 'call_tap').length,
    searches: { now: sNow.length, before: relevant.filter(s => t(s) < weekStart).length },
    topSearchedTrade,
    daily,
    allTime: {
      views: w.profile_views ?? 0,
      contacts: (w.whatsapp_taps ?? 0) + (calls.count ?? 0),
      reviews: ratings.length,
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0,
    },
  }
}

// "▲ 3 vs last week" style label
export function changeLabel({ now, before }: Delta) {
  if (now === before) return { text: 'Same as last week', dir: 0 as const }
  const diff = now - before
  return { text: `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} vs last week`, dir: (diff > 0 ? 1 : -1) as 1 | -1 }
}
