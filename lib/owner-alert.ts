import { supabaseAdmin } from '@/lib/supabase-admin'

// Emails the owner once when a worker's profile goes live (email confirmed + profile exists).
const OWNER = 'juan-lee@upriseanalytics.co.za'
const SITE = 'https://www.wegotsomeone.co.za'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Never throws: an alert must not break sign-up.
export async function alertOwnerWorkerLive(userId: string) {
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = user?.email?.toLowerCase()
    if (!user || !email || !user.email_confirmed_at) return

    const { data: w } = await supabaseAdmin
      .from('workers')
      .select('id, name, skills, city, service_areas, phone, photo_url, is_active')
      .eq('user_id', userId)
      .maybeSingle()
    if (!w) return

    // Claim first so the alert only goes out once per worker.
    const { error: claimError } = await supabaseAdmin.from('email_log').insert({ email, kind: 'owner_alert' })
    if (claimError) return

    const name = (w.name ?? 'Someone').trim()
    const skills = (w.skills ?? []).join(', ') || 'No service picked'
    const areas = ((w.service_areas?.length ? w.service_areas : [w.city]).filter(Boolean) as string[])
    const areaText = areas.slice(0, 4).join(', ') + (areas.length > 4 ? ` +${areas.length - 4} more` : '')
    const live = !!w.is_active && !!w.photo_url
    const profile = `${SITE}/workers/${w.id}`
    const rows: [string, string][] = [
      ['Service', skills],
      ['Areas', areaText || 'None set'],
      ['Phone', w.phone || 'None'],
      ['Email', email],
      ['Status', live ? 'Live in search' : 'Hidden: no profile photo yet'],
    ]
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1D294A;max-width:520px">
<p style="font-size:18px;font-weight:bold;margin:0 0 12px">🎉 ${esc(name)} just went live</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:15px">
${rows.map(([k, v]) => `<tr><td style="color:#4A5470;padding-right:16px">${k}</td><td><strong>${esc(v)}</strong></td></tr>`).join('\n')}
</table>
<p style="margin:16px 0 0"><a href="${profile}" style="color:#2DAB64;font-weight:bold">View profile</a> &nbsp;·&nbsp; <a href="${SITE}/admin" style="color:#2DAB64;font-weight:bold">Owner dashboard</a></p>
</div>`
    const text = `${name} just went live\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nProfile: ${profile}\nOwner dashboard: ${SITE}/admin`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'We Got Someone <alerts@news.wegotsomeone.co.za>', to: [OWNER], subject: `New worker live: ${name} (${skills})`, html, text }),
    })
    if (!res.ok) {
      console.error('owner alert failed', res.status, await res.text())
      await supabaseAdmin.from('email_log').delete().eq('email', email).eq('kind', 'owner_alert')
    }
  } catch (e) {
    console.error('owner alert error', e)
  }
}
