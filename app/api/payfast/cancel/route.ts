import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PAYFAST_MERCHANT_ID, PAYFAST_PASSPHRASE, IS_SANDBOX } from '@/lib/payfast'
import crypto from 'crypto'

function payfastApiSignature(merchantId: string, passphrase: string, timestamp: string): string {
  // PayFast API signature: MD5 of sorted headers as "key=value\n" lines + passphrase line
  const lines = [
    `merchant-id=${merchantId}`,
    `passphrase=${passphrase}`,
    `timestamp=${timestamp}`,
    `version=v1`,
  ].sort().join('\n')
  return crypto.createHash('md5').update(lines).digest('hex')
}

export async function POST(req: NextRequest) {
  // Verify the user is authenticated
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the worker and their subscription token
  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('id, subscriptions(payfast_token, status)')
    .eq('user_id', user.id)
    .single()

  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 })

  const subscription = (worker.subscriptions as any[])?.[0]
  if (!subscription || subscription.status === 'cancelled') {
    return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 })
  }

  const token = subscription.payfast_token

  // If we have a PayFast token, cancel it via their API
  if (token) {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '')
    const signature = payfastApiSignature(PAYFAST_MERCHANT_ID, PAYFAST_PASSPHRASE, timestamp)

    const baseUrl = IS_SANDBOX
      ? 'https://sandbox.payfast.co.za'
      : 'https://api.payfast.co.za'

    const pfRes = await fetch(`${baseUrl}/subscriptions/${token}/cancel`, {
      method: 'PUT',
      headers: {
        'merchant-id': PAYFAST_MERCHANT_ID,
        'version': 'v1',
        'timestamp': timestamp,
        'signature': signature,
      },
    })

    // 200 or 204 = cancelled. Anything else = PayFast error.
    if (!pfRes.ok && pfRes.status !== 204) {
      const text = await pfRes.text()
      console.error('PayFast cancel error:', pfRes.status, text)
      // Still cancel locally — PayFast may have already cancelled or token may be expired
    }
  }

  // Update our DB regardless — profile comes down immediately
  await Promise.all([
    supabaseAdmin
      .from('workers')
      .update({ is_active: false })
      .eq('id', worker.id),
    supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('worker_id', worker.id),
  ])

  return NextResponse.json({ success: true })
}
