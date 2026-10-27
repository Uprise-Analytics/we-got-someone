import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWelcomeIfNeeded } from '@/lib/welcome-email'
import { alertOwnerWorkerLive } from '@/lib/owner-alert'

const VALID_FOR_MS = 14 * 24 * 60 * 60 * 1000

// Activation link we email to people who never confirmed: confirms the email, signs them in and puts the profile live.
export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url)
  const fail = NextResponse.redirect(new URL('/sign-in?error=activation_failed', origin))
  const token = req.nextUrl.searchParams.get('t') ?? ''
  if (!/^[0-9a-f]{48}$/.test(token)) return fail

  const { data: row } = await supabaseAdmin.from('activation_tokens').select('user_id, created_at, used_at').eq('token', token).maybeSingle()
  if (!row || row.used_at || Date.now() - new Date(row.created_at).getTime() > VALID_FOR_MS) return fail

  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(row.user_id)
  if (!user?.email) return fail

  // A fresh one-time code, verified straight away: this confirms the email and sets the session cookies.
  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: user.email })
  if (linkError || !link.properties?.hashed_token) return fail

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (error) return fail

  await supabaseAdmin.from('activation_tokens').update({ used_at: new Date().toISOString() }).eq('token', token)
  await supabaseAdmin.from('workers').update({ is_active: true }).eq('user_id', user.id).eq('is_active', false)
  after(() => Promise.all([sendWelcomeIfNeeded(user.id), alertOwnerWorkerLive(user.id)]))

  return NextResponse.redirect(new URL('/confirmed', origin))
}
