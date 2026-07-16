import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  // Find the code
  const { data: promo } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!promo) return NextResponse.json({ error: 'Invalid code. Check the code and try again.' }, { status: 400 })
  if (promo.uses_count >= promo.max_uses) return NextResponse.json({ error: 'This code has already been used.' }, { status: 400 })

  // Get the worker
  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('id, is_active')
    .eq('user_id', user.id)
    .single()

  if (!worker) return NextResponse.json({ error: 'Worker profile not found.' }, { status: 404 })

  const freeUntil = new Date()
  freeUntil.setDate(freeUntil.getDate() + promo.free_days)

  // Activate worker
  await supabaseAdmin.from('workers').update({
    is_active: true,
    free_until: freeUntil.toISOString(),
  }).eq('id', worker.id)

  // Record subscription
  await supabaseAdmin.from('subscriptions').upsert({
    worker_id: worker.id,
    payfast_token: `promo:${code}`,
    status: 'active',
    next_billing_date: freeUntil.toISOString().split('T')[0],
  }, { onConflict: 'worker_id' })

  // Increment usage
  await supabaseAdmin.from('promo_codes').update({
    uses_count: promo.uses_count + 1
  }).eq('id', promo.id)

  return NextResponse.json({ ok: true, freeDays: promo.free_days })
}
