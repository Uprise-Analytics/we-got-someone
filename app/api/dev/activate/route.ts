import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not found', { status: 404 })
  }

  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: worker } = await serverSupabase
    .from('workers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!worker) return new NextResponse('Worker not found', { status: 404 })

  await supabaseAdmin.from('workers').update({ is_active: true }).eq('id', worker.id)

  await supabaseAdmin.from('subscriptions').upsert({
    worker_id: worker.id,
    payfast_token: 'dev-bypass',
    status: 'active',
    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, { onConflict: 'worker_id' })

  return NextResponse.json({ ok: true })
}
