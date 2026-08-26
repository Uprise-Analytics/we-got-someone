import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { name, whatsapp, type, message } = await req.json()

  if (!name || !message) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('contact_messages')
    .insert({
      name: String(name).slice(0, 200),
      whatsapp: String(whatsapp ?? '').slice(0, 20),
      type: String(type ?? '').slice(0, 100),
      message: String(message).slice(0, 5000),
    })

  if (error) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
