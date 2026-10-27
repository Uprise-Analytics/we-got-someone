import { supabaseAdmin } from '@/lib/supabase-admin'
import { FACEBOOK_URL } from '@/lib/social'

// Automatic welcome email, sent once per person after their email is confirmed and their profile exists.
// Same email as GotSomeone/Emails/Welcome/send_welcome.py. Both record sends in the email_log table.

const SITE = 'https://www.wegotsomeone.co.za'
const FROM = 'We Got Someone <hello@news.wegotsomeone.co.za>'
const REPLY_TO = 'info@wegotsomeone.co.za'
const NAVY = '#1D294A', GREEN = '#2DAB64', MUTED = '#4A5470', LIGHT = '#F3F5F9'

const BUSINESS_WORDS = /\b(pty|ltd|cc|inc|services|solutions|removals|gates|doors|analytics|group|company|co|enterprises|trading|construction|electrical|plumbing|projects|gifting|auto|motors|of|and)\b|&|\(/i

type Worker = {
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

function firstName(name: string | null) {
  const clean = (name ?? '').trim()
  const words = clean.split(/\s+/)
  if (!clean || words.length > 4 || BUSINESS_WORDS.test(clean)) return null
  return words[0][0].toUpperCase() + words[0].slice(1)
}

function joinWords(items: string[]) {
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function statusLine(w: Worker) {
  const missing: string[] = []
  if (!w.photo_url) missing.push('a profile photo')
  if (!w.banner_url) missing.push('a cover photo')
  if (!w.bio?.trim()) missing.push('a short bio')
  if (!w.work_photos?.length) missing.push('photos of your work')
  if ((w.service_areas?.length ?? 0) < 3) missing.push('more of the areas you work in')
  const live = !!w.is_active && !!w.photo_url
  const hidden = 'Right now your profile is hidden from search because it has no profile photo. Add one and you go live straight away.'
  if (!live) return missing.length > 1 ? `${hidden} While you are there, also add ${joinWords(missing.slice(1))}.` : hidden
  if (missing.length) return `Your profile still needs ${joinWords(missing)}.`
  return 'Your profile already looks great. Keep adding photos as you finish new jobs.'
}

function button(href: string, label: string, color: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>`
    + `<td bgcolor="${color}" style="border-radius:12px;background:${color};padding:14px 26px;mso-padding-alt:14px 26px;">`
    + `<a href="${esc(href)}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">${label}</a>`
    + `</td></tr></table>`
}

async function unsubscribeUrl(email: string) {
  await supabaseAdmin.from('email_unsub_tokens').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
  const { data } = await supabaseAdmin.from('email_unsub_tokens').select('token').eq('email', email).single()
  return `${SITE}/api/email/unsubscribe?t=${data!.token}`
}

function build(w: Worker, unsub: string) {
  const first = firstName(w.name)
  const greeting = first ? `Hi ${first},` : 'Hi there,'
  const profileUrl = `${SITE}/workers/${w.id}`
  const profileShort = profileUrl.replace('https://www.', '')
  const waUrl = 'https://wa.me/?text=' + encodeURIComponent(`Hi! Please leave me a quick review on We Got Someone: ${profileUrl}`)
  const status = statusLine(w)
  const subject = first ? `Welcome to We Got Someone, ${first}` : 'Welcome to We Got Someone'
  const p = `margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${MUTED};`
  const h2 = `margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:1.3;color:${NAVY};`
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${LIGHT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LIGHT};"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td align="center" style="padding:28px 24px 20px;border-bottom:4px solid ${GREEN};">
      <img src="cid:wgs-logo" width="280" alt="We Got Someone" style="display:block;width:280px;max-width:80%;height:auto;border:0;">
    </td></tr>
    <tr><td style="padding:32px 32px 8px;">
      <p style="${p}color:${NAVY};font-size:18px;font-weight:bold;">${esc(greeting)}</p>
      <p style="${p}">Thank you for joining We Got Someone. You are one of our first members, and that means a lot to us.</p>
      <p style="${p}">Here are three quick things that will help clients find you and choose you.</p>
    </td></tr>
    <tr><td style="padding:8px 32px 8px;">
      <h2 style="${h2}">1. Complete your profile</h2>
      <p style="${p}">Profiles with work photos, a short bio and all the areas you work in show up higher in search, and clients trust them more.</p>
      <p style="${p}background:${LIGHT};border-left:4px solid ${GREEN};padding:12px 14px;border-radius:8px;color:${NAVY};">${esc(status)}</p>
      ${button(`${SITE}/dashboard/edit`, 'Complete my profile', NAVY)}
    </td></tr>
    <tr><td style="padding:28px 32px 8px;">
      <h2 style="${h2}">2. Share your profile for reviews</h2>
      <p style="${p}">Send your profile to clients you have worked for and ask them to leave a quick review. Reviews are the first thing new clients look at.</p>
      <p style="${p}">Your profile link:<br><a href="${profileUrl}" style="color:${GREEN};font-weight:bold;text-decoration:none;">${profileShort}</a></p>
      ${button(waUrl, 'Share on WhatsApp', GREEN)}
    </td></tr>
    <tr><td style="padding:28px 32px 8px;">
      <h2 style="${h2}">3. Follow us on Facebook</h2>
      <p style="${p}">We feature our workers on our Facebook page. Follow us so you see when it's your turn, and share your post with your clients.</p>
      ${button(FACEBOOK_URL, 'Follow We Got Someone', '#1877F2')}
    </td></tr>
    <tr><td style="padding:28px 32px 32px;">
      <p style="${p}">If you need help with anything, just reply to this email.</p>
      <p style="${p}margin:0;color:${NAVY};">Thanks again,<br><strong>The We Got Someone team</strong></p>
    </td></tr>
  </table>
  <p style="max-width:600px;margin:16px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8A93A8;">
    You are getting this email because you have a profile on <a href="${SITE}" style="color:#8A93A8;">wegotsomeone.co.za</a>.
    <a href="${unsub}" style="color:#8A93A8;">Unsubscribe</a>
  </p>
</td></tr></table>
</body></html>`
  const text = `${greeting}

Thank you for joining We Got Someone. You are one of our first members, and that means a lot to us.

Here are three quick things that will help clients find you and choose you.

1. Complete your profile
Profiles with work photos, a short bio and all the areas you work in show up higher in search, and clients trust them more.
${status}
Complete your profile: ${SITE}/dashboard/edit

2. Share your profile for reviews
Send your profile to clients you have worked for and ask them to leave a quick review. Reviews are the first thing new clients look at.
Your profile link: ${profileUrl}
Share it on WhatsApp: ${waUrl}

3. Follow us on Facebook
We feature our workers on our Facebook page. Follow us so you see when it's your turn, and share your post with your clients.
Follow us: ${FACEBOOK_URL}

If you need help with anything, just reply to this email.

Thanks again,
The We Got Someone team

You are getting this email because you have a profile on wegotsomeone.co.za.
Unsubscribe: ${unsub}
`
  return { subject, html, text }
}

// Sends the welcome email to this user if they are confirmed, have a profile, haven't had it yet and haven't opted out.
// Never throws: a failed email must not break sign-up.
export async function sendWelcomeIfNeeded(userId: string) {
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = user?.email?.toLowerCase()
    if (!user || !email || !user.email_confirmed_at) return

    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('id, name, photo_url, banner_url, bio, work_photos, service_areas, is_active')
      .eq('user_id', userId)
      .maybeSingle()
    if (!worker) return

    const { data: optedOut } = await supabaseAdmin.from('email_optouts').select('email').eq('email', email).maybeSingle()
    if (optedOut) return

    // Claim the send first; the primary key stops a second trigger from sending again.
    const { error: claimError } = await supabaseAdmin.from('email_log').insert({ email, kind: 'welcome' })
    if (claimError) return

    const unsub = await unsubscribeUrl(email)
    const { subject, html, text } = build(worker as Worker, unsub)
    const logo = Buffer.from(await (await fetch(`${SITE}/email/logo.png`)).arrayBuffer()).toString('base64')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [email], reply_to: REPLY_TO, subject, html, text,
        headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        attachments: [{ filename: 'we-got-someone.png', content: logo, content_id: 'wgs-logo' }],
      }),
    })
    if (!res.ok) {
      console.error('welcome email failed', email, res.status, await res.text())
      await supabaseAdmin.from('email_log').delete().eq('email', email).eq('kind', 'welcome')
      return
    }
    const { id } = await res.json()
    await supabaseAdmin.from('email_log').update({ resend_id: id }).eq('email', email).eq('kind', 'welcome')
  } catch (e) {
    console.error('welcome email error', e)
  }
}
