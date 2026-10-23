import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workerId } = body
    if (!workerId) return NextResponse.json({ ok: false }, { status: 400 })

    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('profile_views')
      .eq('id', workerId)
      .single()

    if (worker) {
      await supabaseAdmin
        .from('workers')
        .update({ profile_views: (worker.profile_views ?? 0) + 1 })
        .eq('id', workerId)
      await logEvent(req, { ...body, type: 'profile_view' })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
