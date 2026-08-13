import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyITN, PAYFAST_PASSPHRASE } from '@/lib/payfast'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  if (!verifyITN(params, PAYFAST_PASSPHRASE)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const workerId = params.m_payment_id
  const paymentStatus = params.payment_status
  const token = params.token
  const billingDate = params.billing_date

  if (!workerId) return new NextResponse('Missing worker ID', { status: 400 })

  if (paymentStatus === 'COMPLETE') {
    await supabaseAdmin
      .from('workers')
      .update({ is_active: true })
      .eq('id', workerId)

    await supabaseAdmin.from('subscriptions').upsert({
      worker_id: workerId,
      payfast_token: token ?? null,
      status: 'active',
      next_billing_date: billingDate ?? null,
    }, { onConflict: 'worker_id' })

    // Reward referrer on first payment
    await rewardReferrer(workerId)
  }

  if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    await supabaseAdmin
      .from('workers')
      .update({ is_active: false })
      .eq('id', workerId)

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: paymentStatus === 'CANCELLED' ? 'cancelled' : 'failed' })
      .eq('worker_id', workerId)
  }

  return new NextResponse('OK', { status: 200 })
}

async function rewardReferrer(workerId: string) {
  try {
    // Find an unrewarded referral where this worker is the referred one
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('id, referrer_id')
      .eq('referred_worker_id', workerId)
      .is('rewarded_at', null)
      .single()

    if (!referral) return

    // Extend referrer's free_until by 30 days
    const { data: referrer } = await supabaseAdmin
      .from('workers')
      .select('free_until')
      .eq('id', referral.referrer_id)
      .single()

    const base = referrer?.free_until ? new Date(referrer.free_until) : new Date()
    if (base < new Date()) base.setTime(Date.now())
    base.setDate(base.getDate() + 30)

    await supabaseAdmin
      .from('workers')
      .update({ free_until: base.toISOString() })
      .eq('id', referral.referrer_id)

    // Mark referral as rewarded
    await supabaseAdmin
      .from('referrals')
      .update({ rewarded_at: new Date().toISOString() })
      .eq('id', referral.id)
  } catch {
    // Referrals table may not exist yet — fail silently so payment flow continues
  }
}
