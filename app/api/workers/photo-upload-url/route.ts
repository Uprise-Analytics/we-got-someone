import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const MAX_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000

// Issues a one-time upload link for a brand-new account that has not confirmed its email yet,
// so photos chosen during sign-up are saved even though the user has no session.
export async function POST(req: NextRequest) {
  const { userId, kind, contentType } = await req.json()

  const ext = EXT_BY_TYPE[contentType]
  if (!userId || (kind !== 'photo' && kind !== 'banner') || !ext) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (
    userErr || !user || user.email_confirmed_at ||
    Date.now() - new Date(user.created_at).getTime() > MAX_ACCOUNT_AGE_MS
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = kind === 'photo' ? `${user.id}.${ext}` : `${user.id}-banner.${ext}`
  const { data, error } = await supabaseAdmin.storage
    .from('worker-photos')
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    return NextResponse.json({ error: 'Could not prepare upload' }, { status: 500 })
  }

  return NextResponse.json({ path: data.path, token: data.token })
}
