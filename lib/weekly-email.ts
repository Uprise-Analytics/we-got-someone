import { FACEBOOK_URL } from '@/lib/social'
import { changeLabel, type WorkerStats } from '@/lib/worker-stats'

// The weekly "your numbers" email each worker gets on Monday. Built from the same stats as their dashboard.

const SITE = 'https://www.wegotsomeone.co.za'
const NAVY = '#1D294A', GREEN = '#2DAB64', MUTED = '#4A5470', LIGHT = '#F3F5F9', LINE = '#E6E9F0'
const FONT = 'font-family:Arial,Helvetica,sans-serif;'

const BUSINESS_WORDS = /\b(pty|ltd|cc|inc|services|solutions|removals|gates|doors|analytics|group|company|co|enterprises|trading|construction|electrical|plumbing|projects|gifting|auto|motors|of|and|the|beauty|salon|studio|spa|nails|hair|cleaning|catering|bakery|designs|care|painter|photography)\b|&|\(/i

export type WeeklyWorker = {
  id: string
  name: string | null
  photo_url: string | null
  banner_url: string | null
  bio: string | null
  work_photos: string[] | null
  service_areas: string[] | null
  is_active: boolean | null
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function firstName(name: string | null) {
  const clean = (name ?? '').trim()
  const words = clean.split(/\s+/)
  if (!clean || words.length > 4 || BUSINESS_WORDS.test(clean)) return null
  return words[0][0].toUpperCase() + words[0].slice(1)
}

function button(href: string, label: string, color: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>`
    + `<td bgcolor="${color}" style="border-radius:12px;background:${color};padding:13px 24px;">`
    + `<a href="${esc(href)}" style="display:inline-block;${FONT}font-size:15px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">${label}</a>`
    + `</td></tr></table>`
}

function tile(label: string, value: number, sub: string, subColor: string, accent: string) {
  return `<td width="33%" valign="top" style="padding:6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LIGHT};border-radius:14px;border-top:4px solid ${accent};">
      <tr><td align="center" style="padding:16px 8px 14px;">
        <div style="${FONT}font-size:34px;font-weight:bold;line-height:38px;color:${NAVY};">${value}</div>
        <div style="${FONT}font-size:12px;font-weight:bold;line-height:16px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;padding-top:4px;">${label}</div>
        <div style="${FONT}font-size:12px;line-height:16px;color:${subColor};padding-top:6px;">${sub}</div>
      </td></tr>
    </table>
  </td>`
}

function deltaSub(d: { now: number; before: number }) {
  const c = changeLabel(d)
  return { text: c.text, color: c.dir > 0 ? GREEN : MUTED } // drops stay calm grey, not red
}

// 7 bars, one per day, made from table cells so they render in every email app.
function weekChart(daily: WorkerStats['daily']) {
  const days = daily.slice(-7)
  const max = Math.max(1, ...days.map(d => d.views))
  const H = 90
  const bars = days.map(d => {
    const h = Math.max(4, Math.round((d.views / max) * H))
    const color = d.contacts > 0 ? GREEN : '#AEB7CC'
    return `<td valign="bottom" align="center" style="padding:0 5px;">
      <div style="${FONT}font-size:12px;font-weight:bold;color:${NAVY};padding-bottom:4px;">${d.views || ''}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="${h}" bgcolor="${color}" style="height:${h}px;background:${color};border-radius:6px 6px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    </td>`
  }).join('')
  const labels = days.map(d => {
    const name = new Date(d.day + 'T12:00:00Z').toLocaleDateString('en-ZA', { weekday: 'short', timeZone: 'UTC' })
    return `<td align="center" style="${FONT}font-size:11px;color:${MUTED};padding-top:6px;">${name}</td>`
  }).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr style="height:${H + 22}px;">${bars}</tr><tr>${labels}</tr></table>`
}

function profileTip(w: WeeklyWorker, stats: WorkerStats) {
  const live = !!w.is_active && !!w.photo_url
  if (!live) return 'Your profile is hidden from search because it has no profile photo. Add one and you go live straight away.'
  if (!w.work_photos?.length) return 'Add photos of your work. Profiles with work photos get far more contacts.'
  if (!w.bio?.trim()) return 'Write a short bio so clients know who you are and why to choose you.'
  if ((w.service_areas?.length ?? 0) < 3) return 'Add all the suburbs you work in. Clients search by area, so more areas means more views.'
  if (!stats.allTime.reviews) return 'Your profile looks great. Your next step is your first review.'
  return 'Your profile looks great. Keep adding photos as you finish new jobs.'
}

export function buildWeeklyEmail(w: WeeklyWorker, stats: WorkerStats, unsub: string, now = Date.now()) {
  const first = firstName(w.name)
  const name = (w.name ?? '').trim()
  const profileUrl = `${SITE}/workers/${w.id}`
  const reviewUrl = 'https://wa.me/?text=' + encodeURIComponent(`Hi! Thank you for using me. Please leave me a quick review on We Got Someone, it really helps my business: ${profileUrl}`)
  const from = new Date(now - 6 * 86400000).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })
  const to = new Date(now).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })
  const views = deltaSub(stats.views), contacts = deltaSub(stats.contacts), searches = deltaSub(stats.searches)
  const contactSplit = stats.contacts.now ? `${stats.whatsapp} WhatsApp · ${stats.calls} call${stats.calls === 1 ? '' : 's'}` : contacts.text
  const subject = stats.contacts.now
    ? `${stats.contacts.now} ${stats.contacts.now === 1 ? 'client' : 'clients'} contacted you this week`
    : `${stats.views.now} people viewed your profile this week`
  const tip = profileTip(w, stats)
  const demand = stats.searches.now
    ? `${stats.searches.now} ${stats.searches.now === 1 ? 'person' : 'people'} searched for ${esc(stats.topSearchedTrade ?? 'your services')} on We Got Someone this week.`
    : ''
  const p = `margin:0 0 14px;${FONT}font-size:15px;line-height:1.6;color:${MUTED};`
  const h2 = `margin:0 0 8px;${FONT}font-size:18px;line-height:1.3;color:${NAVY};`

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${LIGHT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LIGHT};"><tr><td align="center" style="padding:24px 10px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td align="center" bgcolor="${NAVY}" style="background:${NAVY};padding:28px 28px 24px;text-align:center;">
      <img src="cid:wgs-logo-white" width="230" alt="We Got Someone" style="display:block;margin:0 auto;width:230px;max-width:70%;height:auto;border:0;">
      <div style="${FONT}font-size:24px;font-weight:bold;line-height:30px;color:#ffffff;padding-top:18px;text-align:center;">Your weekly report</div>
      <div style="${FONT}font-size:14px;line-height:20px;color:#B9C1D6;padding-top:2px;text-align:center;">${esc(name)} · ${from} to ${to}</div>
    </td></tr>
    <tr><td style="padding:24px 22px 4px;">
      <p style="${p}">${first ? `Hi ${esc(first)},` : 'Hi there,'} here is how your profile did over the last 7 days.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${tile('Profile views', stats.views.now, views.text, views.color, '#8FA0C4')}
        ${tile('Client contacts', stats.contacts.now, contactSplit, stats.contacts.now ? GREEN : contacts.color, GREEN)}
        ${tile('Searches for you', stats.searches.now, searches.text, searches.color, '#F2B33D')}
      </tr></table>
    </td></tr>
    <tr><td style="padding:18px 28px 6px;">
      <div style="${FONT}font-size:13px;font-weight:bold;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Profile views per day</div>
      ${weekChart(stats.daily)}
      <div style="${FONT}font-size:12px;color:${MUTED};padding-top:10px;"><span style="color:${GREEN};font-weight:bold;">■</span> Days a client contacted you</div>
      ${demand ? `<p style="${p}margin-top:16px;background:#FFF8E6;border-left:4px solid #F2B33D;padding:12px 14px;border-radius:8px;color:${NAVY};">${demand}</p>` : ''}
    </td></tr>
    <tr><td style="padding:10px 28px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
        <tr>
          <td align="center" style="padding:14px 4px;${FONT}"><div style="font-size:20px;font-weight:bold;color:${NAVY};">${stats.allTime.views}</div><div style="font-size:12px;color:${MUTED};">views all time</div></td>
          <td align="center" style="padding:14px 4px;${FONT}"><div style="font-size:20px;font-weight:bold;color:${NAVY};">${stats.allTime.contacts}</div><div style="font-size:12px;color:${MUTED};">contacts all time</div></td>
          <td align="center" style="padding:14px 4px;${FONT}"><div style="font-size:20px;font-weight:bold;color:${NAVY};">${stats.allTime.reviews ? `${stats.allTime.rating} ★` : '0'}</div><div style="font-size:12px;color:${MUTED};">${stats.allTime.reviews} review${stats.allTime.reviews === 1 ? '' : 's'}</div></td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:22px 28px 4px;">
      <h2 style="${h2}">Ask your happy clients for a review</h2>
      <p style="${p}">Reviews are the first thing new clients look at, and they push you higher in search. After every job, send your client this link. It takes them 30 seconds.</p>
      ${button(reviewUrl, 'Ask for a review on WhatsApp', GREEN)}
    </td></tr>
    <tr><td style="padding:24px 28px 4px;">
      <h2 style="${h2}">Follow us on Facebook</h2>
      <p style="${p}">We feature our workers on our Facebook page. Follow us so you see when it is your turn, and share your post with your clients.</p>
      ${button(FACEBOOK_URL, 'Follow We Got Someone', '#1877F2')}
    </td></tr>
    <tr><td style="padding:24px 28px 4px;">
      <h2 style="${h2}">Tip for this week</h2>
      <p style="${p}background:${LIGHT};border-left:4px solid ${GREEN};padding:12px 14px;border-radius:8px;color:${NAVY};">${esc(tip)}</p>
    </td></tr>
    <tr><td align="center" style="padding:20px 28px 30px;">
      ${button(`${SITE}/dashboard`, 'Open my dashboard', NAVY)}
      <p style="${p}margin:18px 0 0;font-size:13px;">Questions? Just reply to this email.<br><strong style="color:${NAVY};">The We Got Someone team</strong></p>
    </td></tr>
  </table>
  <p style="max-width:600px;margin:16px auto 0;${FONT}font-size:12px;line-height:1.5;color:#8A93A8;">
    You are getting this weekly report because you have a profile on <a href="${SITE}" style="color:#8A93A8;">wegotsomeone.co.za</a>.
    <a href="${unsub}" style="color:#8A93A8;">Unsubscribe</a>
  </p>
</td></tr></table>
</body></html>`

  const text = `Your weekly report: ${name} (${from} to ${to})

${first ? `Hi ${first},` : 'Hi there,'} here is how your profile did over the last 7 days.

Profile views: ${stats.views.now} (${views.text})
Client contacts: ${stats.contacts.now} (${contactSplit})
Searches for you: ${stats.searches.now} (${searches.text})
${demand ? '\n' + demand.replace(/&amp;/g, '&') + '\n' : ''}
All time: ${stats.allTime.views} views, ${stats.allTime.contacts} contacts, ${stats.allTime.reviews} reviews

Ask your happy clients for a review:
${reviewUrl}

Follow us on Facebook: ${FACEBOOK_URL}

Tip for this week: ${tip}

Open your dashboard: ${SITE}/dashboard

The We Got Someone team

Unsubscribe: ${unsub}
`
  return { subject, html, text }
}
