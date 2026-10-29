import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWelcomeIfNeeded } from '@/lib/welcome-email'
import { alertOwnerWorkerLive } from '@/lib/owner-alert'

// New profiles stay hidden until the email is confirmed. Wherever the site notices a confirmed user
// (confirmation link, "check your email" page, activation link, dashboard), this switches the profile on
// and sends the welcome email and the owner alert.
// A profile only gets switched on once: the owner_alert row in email_log marks it as having gone live,
// so a profile that is switched off later is never turned back on here.
export async function goLiveIfConfirmed(userId: string) {
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = user?.email?.toLowerCase()
    if (!user || !email || !user.email_confirmed_at) return

    const { data: wentLive } = await supabaseAdmin.from('email_log').select('email').eq('email', email).eq('kind', 'owner_alert').maybeSingle()
    if (!wentLive) {
      await supabaseAdmin.from('workers').update({ is_active: true }).eq('user_id', userId).eq('is_active', false)
    }
    await Promise.all([sendWelcomeIfNeeded(userId), alertOwnerWorkerLive(userId)])
  } catch (e) {
    console.error('go live error', e)
  }
}

// Safety net for the emails: finds confirmed workers who never got the owner alert (and so likely no welcome
// email either) and runs the go-live step for them. Runs at most every 10 minutes per server instance,
// piggybacking on normal site traffic.
let lastSweep = 0
export async function sweepPendingGoLive() {
  if (Date.now() - lastSweep < 10 * 60 * 1000) return
  lastSweep = Date.now()
  try {
    const [{ data: workers }, { data: alerted }, { data: list }] = await Promise.all([
      supabaseAdmin.from('workers').select('user_id'),
      supabaseAdmin.from('email_log').select('email').eq('kind', 'owner_alert'),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ])
    const done = new Set((alerted ?? []).map(r => r.email))
    const withProfile = new Set((workers ?? []).map(w => w.user_id))
    const pending = (list?.users ?? []).filter(u => u.email_confirmed_at && withProfile.has(u.id) && !done.has(u.email?.toLowerCase() ?? ''))
    for (const u of pending) await goLiveIfConfirmed(u.id)
  } catch (e) {
    console.error('go live sweep error', e)
  }
}
