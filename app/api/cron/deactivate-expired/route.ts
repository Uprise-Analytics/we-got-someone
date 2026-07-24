import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find active workers whose free trial has expired
  const { data: expiredWorkers } = await supabaseAdmin
    .from('workers')
    .select('id')
    .eq('is_active', true)
    .not('free_until', 'is', null)
    .lt('free_until', new Date().toISOString())

  if (!expiredWorkers?.length) {
    return NextResponse.json({ ok: true, deactivated: 0 })
  }

  const workerIds = expiredWorkers.map(w => w.id)

  // Keep any who have since paid (real PayFast token, not promo)
  const { data: paidSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('worker_id')
    .in('worker_id', workerIds)
    .eq('status', 'active')
    .not('payfast_token', 'like', 'promo:%')

  const paidIds = new Set(paidSubs?.map(s => s.worker_id) ?? [])
  const toDeactivate = workerIds.filter(id => !paidIds.has(id))

  if (!toDeactivate.length) {
    return NextResponse.json({ ok: true, deactivated: 0 })
  }

  await supabaseAdmin
    .from('workers')
    .update({ is_active: false })
    .in('id', toDeactivate)

  return NextResponse.json({ ok: true, deactivated: toDeactivate.length })
}
