import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Simple in-memory rate limit: max 5 requests per IP per minute
const ipHits = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.reset) {
    ipHits.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) return NextResponse.json({ ok: false }, { status: 429 })

    const { email, trade, area, utm_source } = await req.json()

    if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ ok: false })

    await supabaseAdmin
      .from('leads')
      .upsert(
        {
          email: email.slice(0, 254),
          trade: (trade ?? '').slice(0, 100) || null,
          area: (area ?? '').slice(0, 100) || null,
          utm_source: (utm_source ?? '').slice(0, 100) || null,
        },
        { onConflict: 'email' }
      )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
