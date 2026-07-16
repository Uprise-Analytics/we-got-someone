import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { name, whatsapp, type, message } = await req.json()

  if (!name || !message) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('contact_messages')
    .insert({ name, whatsapp, type, message })

  if (error) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
