import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWorkerStats, saDay } from '@/lib/worker-stats'
import { buildWeeklyEmail, type WeeklyWorker } from '@/lib/weekly-email'

// Monday-morning "your numbers" email to every worker (Vercel cron, see vercel.json).
// Manual use, same CRON_SECRET bearer:
//   ?test=you@example.com[&worker=<id>]  sends one preview to that address only, nothing logged
//   ?dry=1                                lists who would get it, sends nothing
export const maxDuration = 60

const SITE = 'https://www.wegotsomeone.co.za'
const FROM = 'We Got Someone <hello@news.wegotsomeone.co.za>'
const REPLY_TO = 'info@wegotsomeone.co.za'
const COLS = 'id, user_id, name, photo_url, banner_url, bio, work_photos, service_areas, city, skills, is_active, profile_views, whatsapp_taps'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function unsubscribeUrl(email: string) {
  await supabaseAdmin.from('email_unsub_tokens').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
  const { data } = await supabaseAdmin.from('email_unsub_tokens').select('token').eq('email', email).single()
  return `${SITE}/api/email/unsubscribe?t=${data!.token}`
}

async function send(to: string, subject: string, html: string, text: string, unsub: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [to], reply_to: REPLY_TO, subject, html, text,
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()).id as string
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const test = url.searchParams.get('test')
  const dry = url.searchParams.get('dry') === '1'

  // Preview: one email to the given address, built from a real worker's numbers.
  if (test) {
    const id = url.searchParams.get('worker')
    const q = supabaseAdmin.from('workers').select(COLS).limit(1)
    const { data } = id ? await q.eq('id', id) : await q.eq('is_active', true).order('profile_views', { ascending: false })
    const w = data?.[0]
    if (!w) return NextResponse.json({ error: 'worker not found' }, { status: 404 })
    const stats = await getWorkerStats(w)
    const { subject, html, text } = buildWeeklyEmail(w as WeeklyWorker, stats, `${SITE}/api/email/unsubscribe`)
    const sent = await send(test, `[Preview] ${subject}`, html, text, `${SITE}/api/email/unsubscribe`)
    return NextResponse.json({ ok: true, preview: w.name, subject, sent })
  }

  const [{ data: workers }, { data: { users } }, { data: optouts }] = await Promise.all([
    supabaseAdmin.from('workers').select(COLS),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from('email_optouts').select('email'),
  ])
  const optedOut = new Set((optouts ?? []).map(o => o.email.toLowerCase()))
  const userById = new Map(users.map(u => [u.id, u]))
  const kind = `weekly-${saDay(Date.now())}` // one report per worker per run day
  const recipients = (workers ?? []).flatMap(w => {
    const u = userById.get(w.user_id)
    const email = u?.email?.toLowerCase()
    return u?.email_confirmed_at && email && !optedOut.has(email) ? [{ w, email }] : []
  })
  if (dry) return NextResponse.json({ kind, count: recipients.length, names: recipients.map(r => r.w.name?.trim()) })

  const results: { name: string; status: string }[] = []
  for (const { w, email } of recipients) {
    // Claim first: the email_log primary key (email, kind) stops a double send if the job runs twice.
    const { error: claimError } = await supabaseAdmin.from('email_log').insert({ email, kind })
    if (claimError) { results.push({ name: w.name, status: 'already sent' }); continue }
    try {
      const stats = await getWorkerStats(w)
      const unsub = await unsubscribeUrl(email)
      const { subject, html, text } = buildWeeklyEmail(w as WeeklyWorker, stats, unsub)
      const id = await send(email, subject, html, text, unsub)
      await supabaseAdmin.from('email_log').update({ resend_id: id }).eq('email', email).eq('kind', kind)
      results.push({ name: w.name, status: 'sent' })
    } catch (e) {
      console.error('weekly email failed', email, e)
      await supabaseAdmin.from('email_log').delete().eq('email', email).eq('kind', kind)
      results.push({ name: w.name, status: 'failed' })
    }
    await sleep(600) // stay under Resend's 2 requests per second
  }
  return NextResponse.json({ kind, sent: results.filter(r => r.status === 'sent').length, results })
}
