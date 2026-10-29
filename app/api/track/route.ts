import { NextRequest, NextResponse, after } from 'next/server'
import { logEvent } from '@/lib/analytics'
import { sweepPendingGoLive } from '@/lib/go-live'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.type === 'page_view' || body.type === 'search') await logEvent(req, body)
  } catch {}
  after(() => sweepPendingGoLive())
  return NextResponse.json({ ok: true })
}
