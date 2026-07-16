import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    name, bio, skills, phone, photoUrl, dailyRate, availableNow,
    gender, dateOfBirth, languages, ownTransport, yearsExperience, serviceAreas, workPhotos,
  } = await req.json()

  const primaryCity = serviceAreas?.[0] ?? ''

  const fullUpdates: Record<string, unknown> = {
    name, bio, skills, phone,
    city: primaryCity,
    area: primaryCity,
    available_now: availableNow ?? false,
    daily_rate: dailyRate ?? null,
    gender: gender ?? null,
    date_of_birth: dateOfBirth ?? null,
    languages: languages ?? [],
    own_transport: ownTransport ?? false,
    years_experience: yearsExperience ?? null,
    service_areas: serviceAreas ?? [],
    work_photos: workPhotos ?? [],
  }
  if (photoUrl !== undefined) fullUpdates.photo_url = photoUrl

  const { error: fullError } = await supabaseAdmin
    .from('workers')
    .update(fullUpdates)
    .eq('user_id', user.id)

  if (!fullError) return NextResponse.json({ ok: true })

  // service_areas column may not exist yet — fall back without it
  const baseUpdates: Record<string, unknown> = {
    name, bio, skills, phone,
    city: primaryCity,
    area: primaryCity,
    available_now: availableNow ?? false,
    daily_rate: dailyRate ?? null,
    gender: gender ?? null,
    date_of_birth: dateOfBirth ?? null,
    languages: languages ?? [],
    own_transport: ownTransport ?? false,
    years_experience: yearsExperience ?? null,
  }
  if (photoUrl !== undefined) baseUpdates.photo_url = photoUrl

  const { error: baseError } = await supabaseAdmin
    .from('workers')
    .update(baseUpdates)
    .eq('user_id', user.id)

  if (baseError) return NextResponse.json({ error: baseError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
