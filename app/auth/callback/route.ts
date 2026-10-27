import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse, after } from 'next/server'
import { sendWelcomeIfNeeded } from '@/lib/welcome-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/confirmed'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Email just got confirmed: send the welcome email after the redirect goes out
      const userId = data.user?.id
      // Profiles made before confirming are hidden; switch them on now the email is confirmed.
      // Only right after confirming, so this never re-enables a profile that was switched off later.
      const confirmedAt = data.user?.email_confirmed_at ? new Date(data.user.email_confirmed_at).getTime() : 0
      if (userId && Date.now() - confirmedAt < 30 * 60 * 1000) {
        await supabaseAdmin.from('workers').update({ is_active: true }).eq('user_id', userId).eq('is_active', false)
      }
      if (userId) after(() => sendWelcomeIfNeeded(userId))
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/sign-in?error=confirmation_failed', origin))
}
