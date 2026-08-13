import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, trade, area, utm_source } = await req.json()
    if (!email || !email.includes('@')) return NextResponse.json({ ok: false })

    await supabaseAdmin
      .from('leads')
      .upsert(
        { email, trade: trade ?? null, area: area ?? null, utm_source: utm_source ?? null },
        { onConflict: 'email' }
      )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
