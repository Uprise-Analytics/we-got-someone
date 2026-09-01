import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  // Verify the caller is the authenticated user they claim to be
  let sessionUserId: string | null = null
  const authHeader = req.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (bearerToken) {
    const { data } = await supabaseAdmin.auth.getUser(bearerToken)
    sessionUserId = data.user?.id ?? null
  } else {
    const cookieStore = await cookies()
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data } = await serverSupabase.auth.getUser()
    sessionUserId = data.user?.id ?? null
  }
  if (!sessionUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    userId, name, bio, skills, phone, photoUrl, bannerUrl,
    email, website, gender, dateOfBirth, languages, serviceAreas,
    referralCode, utmSource, utmMedium, utmCampaign, utmContent,
  } = body

  if (!userId || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Prevent creating a profile on behalf of another user
  if (userId !== sessionUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    if (fallbackError) {
      console.error('worker create fallback failed', { userId, error: fallbackError })
      return NextResponse.json({ error: 'Could not create profile' }, { status: 500 })
    }

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
