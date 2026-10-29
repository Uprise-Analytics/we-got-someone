import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { goLiveIfConfirmed } from '@/lib/go-live'

export async function GET(req: NextRequest) {
  const uid = new URL(req.url).searchParams.get('uid')
  if (!uid) {
    return NextResponse.json({ confirmed: false })
  }

  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(uid)
  if (error || !user) {
    return NextResponse.json({ confirmed: false })
  }

  // Covers confirmations made on another device, where the link never reaches our callback
  if (user.email_confirmed_at) after(() => goLiveIfConfirmed(user.id))
  return NextResponse.json({ confirmed: !!user.email_confirmed_at })
}
