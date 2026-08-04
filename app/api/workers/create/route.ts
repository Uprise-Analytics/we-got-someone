import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    userId, name, bio, skills, phone, photoUrl, bannerUrl,
    email, website, gender, dateOfBirth, languages, serviceAreas,
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
    banner_url: bannerUrl ?? null,
    email: email ?? null,
    website: website ?? null,
    is_active: false,
    gender: gender ?? null,
    date_of_birth: dateOfBirth ?? null,
    languages: languages ?? [],
    service_areas: serviceAreas ?? [],
  })

  if (error) {
    // service_areas / banner columns may not exist yet — retry without them
    const { error: fallbackError } = await supabaseAdmin.from('workers').insert({
      user_id: userId,
      name, bio, skills,
      city: primaryCity,
      area: primaryCity,
      phone,
      photo_url: photoUrl ?? null,
      is_active: false,
      gender: gender ?? null,
      date_of_birth: dateOfBirth ?? null,
      languages: languages ?? [],
    })
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
