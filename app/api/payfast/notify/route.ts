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
