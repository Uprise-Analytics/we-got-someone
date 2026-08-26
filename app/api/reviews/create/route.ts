import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Max 3 reviews per IP per 10 minutes
const ipHits = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.reset) {
    ipHits.set(ip, { count: 1, reset: now + 10 * 60_000 })
    return false
  }
  if (entry.count >= 3) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many reviews. Try again later.' }, { status: 429 })

  const { worker_id, reviewer_name, rating, comment } = await req.json()

  if (!worker_id || !UUID_RE.test(worker_id)) {
    return NextResponse.json({ error: 'Invalid worker.' }, { status: 400 })
  }
  if (!reviewer_name || typeof reviewer_name !== 'string') {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1 to 5.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('reviews').insert({
    worker_id,
    reviewer_name: reviewer_name.slice(0, 100),
    rating,
    comment: comment ? String(comment).slice(0, 1000) : null,
  })

  if (error) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
