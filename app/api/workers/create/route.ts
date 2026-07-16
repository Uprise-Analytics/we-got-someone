import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    userId, name, bio, skills, phone, photoUrl, dailyRate,
    gender, dateOfBirth, languages, ownTransport, yearsExperience, serviceAreas,
  } = body

  if (!userId || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const primaryCity = serviceAreas?.[0] ?? ''

  const { error } = await supabaseAdmin.from('workers').insert({
    user_id: userId,
    name,
    bio,
    skills,
    city: primaryCity,
    area: primaryCity,
    phone,
    photo_url: photoUrl ?? null,
    daily_rate: dailyRate ?? null,
    is_active: false,
    gender: gender ?? null,
    date_of_birth: dateOfBirth ?? null,
    languages: languages ?? [],
    own_transport: ownTransport ?? false,
    years_experience: yearsExperience ?? null,
    service_areas: serviceAreas ?? [],
  })

  if (error) {
    // service_areas column may not exist yet — retry without it
    const { error: fallbackError } = await supabaseAdmin.from('workers').insert({
      user_id: userId,
      name, bio, skills,
      city: primaryCity,
      area: primaryCity,
      phone,
      photo_url: photoUrl ?? null,
      daily_rate: dailyRate ?? null,
      is_active: false,
      gender: gender ?? null,
      date_of_birth: dateOfBirth ?? null,
      languages: languages ?? [],
      own_transport: ownTransport ?? false,
      years_experience: yearsExperience ?? null,
    })
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
