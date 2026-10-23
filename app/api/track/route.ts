import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.type === 'page_view' || body.type === 'search') await logEvent(req, body)
  } catch {}
  return NextResponse.json({ ok: true })
}
