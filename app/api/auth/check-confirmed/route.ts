import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const uid = new URL(req.url).searchParams.get('uid')
  if (!uid) {
    return NextResponse.json({ confirmed: false })
  }

  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(uid)
  if (error || !user) {
    return NextResponse.json({ confirmed: false })
  }

  return NextResponse.json({ confirmed: !!user.email_confirmed_at })
}
