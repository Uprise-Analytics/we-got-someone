import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const toDeactivate = new Set<string>()

  // ── Check 1: free trial has expired ──
  const { data: expiredWorkers } = await supabaseAdmin
    .from('workers')
    .select('id')
    .eq('is_active', true)
    .not('free_until', 'is', null)
    .lt('free_until', new Date().toISOString())

  for (const w of expiredWorkers ?? []) toDeactivate.add(w.id)

  // ── Check 2: promo code was revoked (uses_count reset to 0) ──
  // Find all promo subscriptions for active workers
  const { data: promoSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('worker_id, payfast_token')
    .like('payfast_token', 'promo:%')
    .eq('status', 'active')

  if (promoSubs?.length) {
    // Get the code names from the tokens (e.g. "promo:FOUNDER-GS01" → "FOUNDER-GS01")
    const codes = promoSubs.map(s => s.payfast_token.replace('promo:', ''))

    const { data: revokedCodes } = await supabaseAdmin
      .from('promo_codes')
      .select('code')
      .in('code', codes)
      .eq('uses_count', 0)

    if (revokedCodes?.length) {
      const revokedSet = new Set(revokedCodes.map(p => p.code))
      for (const sub of promoSubs) {
        const code = sub.payfast_token.replace('promo:', '')
        if (revokedSet.has(code)) toDeactivate.add(sub.worker_id)
      }
    }
  }

  if (!toDeactivate.size) {
    return NextResponse.json({ ok: true, deactivated: 0 })
  }

  const ids = [...toDeactivate]

  // Keep anyone who has since paid with a real PayFast subscription
  const { data: paidSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('worker_id')
    .in('worker_id', ids)
    .eq('status', 'active')
    .not('payfast_token', 'like', 'promo:%')

  const paidIds = new Set(paidSubs?.map(s => s.worker_id) ?? [])
  const finalList = ids.filter(id => !paidIds.has(id))

  if (!finalList.length) {
    return NextResponse.json({ ok: true, deactivated: 0 })
  }

  await supabaseAdmin
    .from('workers')
    .update({ is_active: false })
    .in('id', finalList)

  // Mark their promo subscriptions as cancelled
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .in('worker_id', finalList)
    .like('payfast_token', 'promo:%')

  return NextResponse.json({ ok: true, deactivated: finalList.length })
}
