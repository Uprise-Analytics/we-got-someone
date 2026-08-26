import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Window: workers whose trial expires within the next 26 hours, or expired up to 6 hours ago.
  // Runs at 2am, one hour before the deactivate cron at 3am.
  // This gives us a chance to extend their free_until before they get deactivated.
  const now = new Date()
  const windowStart = new Date(now.getTime() - 6 * 60 * 60 * 1000)   // 6 hours ago
  const windowEnd   = new Date(now.getTime() + 26 * 60 * 60 * 1000)  // 26 hours from now

  const { data: eligible } = await supabaseAdmin
    .from('workers')
    .select('id, free_until')
    .eq('is_active', true)
    .or('guarantee_claimed.is.null,guarantee_claimed.eq.false')
    .or('whatsapp_taps.is.null,whatsapp_taps.eq.0')
    .not('free_until', 'is', null)
    .gte('free_until', windowStart.toISOString())
    .lte('free_until', windowEnd.toISOString())

  if (!eligible?.length) {
    return NextResponse.json({ ok: true, extended: 0 })
  }

  const extended: string[] = []

  for (const worker of eligible) {
    // Extend from their current expiry, not from today, so they get a full 30-day second month
    const current = new Date(worker.free_until)
    current.setDate(current.getDate() + 30)

    const { error } = await supabaseAdmin
      .from('workers')
      .update({
        free_until: current.toISOString(),
        guarantee_claimed: true,
      })
      .eq('id', worker.id)

    if (!error) extended.push(worker.id)
  }

  return NextResponse.json({ ok: true, extended: extended.length, ids: extended })
}
