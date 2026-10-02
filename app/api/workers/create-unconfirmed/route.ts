import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, name, bio, skills, phone, photoUrl, bannerUrl,
    email, website, gender, dateOfBirth, languages, serviceAreas,
    referralCode, utmSource, utmMedium, utmCampaign, utmContent } = body

  if (!userId || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify this user was created very recently — prevents using someone else's userId
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const fiveMinutes = 5 * 60 * 1000
  if (Date.now() - new Date(user.created_at).getTime() > fiveMinutes) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const primaryCity = serviceAreas?.[0] ?? ''
  const myReferralCode = generateReferralCode()

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
    name, bio, skills,
    city: primaryCity,
    area: primaryCity,
    phone,
    photo_url: photoUrl ?? null,
    banner_url: bannerUrl ?? null,
    email: email ?? null,
    website: website ?? null,
    is_active: true,
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (referredBy && newWorker) {
    await supabaseAdmin.from('referrals').insert({
      referrer_id: referredBy,
      referred_worker_id: newWorker.id,
    }).then(() => {})
  }

  return NextResponse.json({ workerId: newWorker?.id })
}
