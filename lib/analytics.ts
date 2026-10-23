import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const TYPES = ['page_view', 'profile_view', 'whatsapp_tap', 'search'] as const
type EventType = (typeof TYPES)[number]

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|vercel|curl|python|axios|node-fetch/i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(value: unknown, max = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'mobile'
  return 'desktop'
}

function referrerHost(value: unknown) {
  const ref = text(value, 500)
  if (!ref) return null
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '')
    return host === 'wegotsomeone.co.za' ? null : host
  } catch {
    return null
  }
}

// Saves one analytics event. Never throws: tracking must not break the page that sent it.
export async function logEvent(req: NextRequest, body: Record<string, unknown>) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    const type = body.type as EventType
    if (!TYPES.includes(type) || !ua || BOTS.test(ua)) return

    const workerId = typeof body.workerId === 'string' && UUID.test(body.workerId) ? body.workerId : null
    const results = typeof body.results === 'number' && Number.isFinite(body.results) ? Math.round(body.results) : null

    await supabaseAdmin.from('analytics_events').insert({
      type,
      visitor_id: text(body.visitorId, 64),
      session_id: text(body.sessionId, 64),
      path: text(body.path, 300),
      worker_id: workerId,
      trade: text(body.trade, 80),
      area: text(body.area, 80),
      results,
      referrer: referrerHost(body.referrer),
      utm_source: text(body.utmSource, 80),
      device: device(ua),
    })
  } catch {}
}
