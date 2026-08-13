import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    userId, name, bio, skills, phone, photoUrl, bannerUrl,
    email, website, gender, dateOfBirth, languages, serviceAreas,
    referralCode, utmSource, utmMedium, utmCampaign, utmContent,
  } = body

  if (!userId || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const primaryCity = serviceAreas?.[0] ?? ''
  const myReferralCode = generateReferralCode()

  // Resolve referralCode → referrer worker id
  let referredBy: string | null = null
  if (referralCode) {
    const { data: referrer } = await supabaseAdmin
      .from('workers')
      .select('id')
      .eq('referral_code', referralCode)
      .single()
    referredBy = referrer?.id ?? null
  }

  const { data: newWorker, error } = await supabaseAdmin.from('workers').insert({
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
    referral_code: myReferralCode,
    referred_by: referredBy,
    utm_source: utmSource ?? null,
    utm_medium: utmMedium ?? null,
    utm_campaign: utmCampaign ?? null,
    utm_content: utmContent ?? null,
  }).select('id').single()

  if (error) {
    // Columns may not exist yet — retry with only guaranteed columns
    const { data: fallbackWorker, error: fallbackError } = await supabaseAdmin.from('workers').insert({
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
    }).select('id').single()
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  }

  // Record referral row so we can reward the referrer on payment
  if (referredBy && newWorker?.id) {
    await supabaseAdmin.from('referrals').insert({
      referrer_id: referredBy,
      referred_worker_id: newWorker.id,
    })
  }

  return NextResponse.json({ ok: true })
}
