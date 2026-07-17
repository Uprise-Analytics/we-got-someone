import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { workerId } = await req.json()
    if (!workerId) return NextResponse.json({ ok: false }, { status: 400 })

    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('whatsapp_taps')
      .eq('id', workerId)
      .single()

    if (worker) {
      await supabaseAdmin
        .from('workers')
        .update({ whatsapp_taps: (worker.whatsapp_taps ?? 0) + 1 })
        .eq('id', workerId)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
