import { NextRequest, NextResponse } from 'next/server'
import { loadDashboard, type Delta } from '@/lib/admin'

// Monday-morning email to the owner with last week's numbers (Vercel cron, see vercel.json).
// Can also be triggered by hand with the same CRON_SECRET bearer token.
const OWNER = 'juan-lee@upriseanalytics.co.za'
const SITE = 'https://www.wegotsomeone.co.za'
const GOAL = 50 // customer contacts per week we're aiming for

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function change({ now, before }: Delta) {
  if (now === before) return { text: 'same as last week', color: '#4A5470' }
  const diff = now - before
  const pct = before > 0 ? ` (${diff > 0 ? '+' : ''}${Math.round((diff / before) * 100)}%)` : ''
  return { text: `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} vs last week${pct}`, color: diff > 0 ? '#2DAB64' : '#D64545' }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const d = await loadDashboard(7)
  const k = d.kpis

  const rows: { label: string; delta: Delta; main?: boolean }[] = [
    { label: 'Customer contacts (WhatsApp + calls)', delta: k.contacts, main: true },
    { label: 'Visitors', delta: k.visitors },
    { label: 'Profile views', delta: k.profileViews },
    { label: 'New workers', delta: k.signups },
    { label: 'New reviews', delta: k.reviews },
  ]

  const top = d.workers
    .filter(w => !w.isOwner && (w.tapsPeriod > 0 || w.viewsPeriod > 0))
    .sort((a, b) => b.tapsPeriod - a.tapsPeriod || b.viewsPeriod - a.viewsPeriod)
    .slice(0, 5)

  const missed = d.emptySearches.slice(0, 5)
  const progress = Math.min(100, Math.round((k.contacts.now / GOAL) * 100))

  const tip =
    k.contacts.now >= GOAL ? 'You hit the weekly goal. Time to start asking your busiest workers if they would pay to stay listed.'
    : missed.length ? `People searched for things you don't have yet (see below). Sign up workers for those first.`
    : k.visitors.now < k.visitors.before ? 'Fewer visitors than last week. Post in a few more local Facebook groups this week.'
    : 'Keep posting in local Facebook groups and ask workers to share their profile link on WhatsApp status.'

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1D294A;max-width:560px">
<p style="font-size:20px;font-weight:bold;margin:0 0 4px">Your week on We Got Someone</p>
<p style="color:#4A5470;margin:0 0 18px">Last 7 days. ${k.live} workers live in search.</p>
<div style="background:#F2FBF6;border-radius:10px;padding:14px 16px;margin-bottom:18px">
<p style="margin:0 0 6px"><strong>${k.contacts.now} of ${GOAL}</strong> customer contacts this week</p>
<div style="background:#DDEFE5;border-radius:6px;height:10px"><div style="background:#2DAB64;border-radius:6px;height:10px;width:${progress}%"></div></div>
</div>
<table cellpadding="7" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:15px">
${rows.map(r => { const c = change(r.delta); return `<tr style="border-bottom:1px solid #EEF0F4"><td>${r.main ? '<strong>' + r.label + '</strong>' : r.label}</td><td style="text-align:right;font-weight:bold;font-size:${r.main ? 18 : 15}px">${r.delta.now}</td><td style="text-align:right;color:${c.color};font-size:13px;white-space:nowrap">${c.text}</td></tr>` }).join('\n')}
</table>
${top.length ? `<p style="font-weight:bold;margin:22px 0 6px">Busiest workers</p>
<table cellpadding="5" cellspacing="0" style="border-collapse:collapse;font-size:14px">
${top.map(w => `<tr><td><a href="${SITE}/workers/${w.id}" style="color:#1D294A">${esc(w.name)}</a></td><td style="color:#4A5470;padding-left:14px">${w.tapsPeriod} contact${w.tapsPeriod === 1 ? '' : 's'}, ${w.viewsPeriod} view${w.viewsPeriod === 1 ? '' : 's'}</td></tr>`).join('\n')}
</table>` : ''}
${missed.length ? `<p style="font-weight:bold;margin:22px 0 6px">Searches that found nobody</p>
<ul style="margin:0;padding-left:20px;font-size:14px">${missed.map(([q, n]) => `<li>${esc(q)} (${n}×)</li>`).join('')}</ul>` : ''}
<p style="margin:22px 0 0;padding:12px 14px;background:#F6F7FA;border-radius:8px"><strong>This week:</strong> ${esc(tip)}</p>
<p style="margin:18px 0 0"><a href="${SITE}/admin" style="color:#2DAB64;font-weight:bold">Open the full dashboard</a></p>
</div>`

  const text = [
    'Your week on We Got Someone (last 7 days)',
    `${k.contacts.now} of ${GOAL} customer contacts this week. ${k.live} workers live.`,
    '',
    ...rows.map(r => `${r.label}: ${r.delta.now} (${change(r.delta).text})`),
    ...(top.length ? ['', 'Busiest workers:', ...top.map(w => `- ${w.name}: ${w.tapsPeriod} contacts, ${w.viewsPeriod} views`)] : []),
    ...(missed.length ? ['', 'Searches that found nobody:', ...missed.map(([q, n]) => `- ${q} (${n}x)`)] : []),
    '', `This week: ${tip}`, '', `Dashboard: ${SITE}/admin`,
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'We Got Someone <alerts@news.wegotsomeone.co.za>',
      to: [OWNER],
      subject: `Your week: ${k.contacts.now} contacts, ${k.visitors.now} visitors, ${k.signups.now} new workers`,
      html,
      text,
    }),
  })
  if (!res.ok) {
    console.error('weekly scoreboard failed', res.status, await res.text())
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true, contacts: k.contacts.now })
}
