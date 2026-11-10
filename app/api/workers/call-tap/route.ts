import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics'

// Records a customer tapping Call on a worker profile (shown as a contact on /admin).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.workerId) return NextResponse.json({ ok: false }, { status: 400 })
    await logEvent(req, { ...body, type: 'call_tap' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
