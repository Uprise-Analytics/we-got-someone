import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const API = 'https://graph.facebook.com/v26.0/'

function commentText(link: string) {
  return link.includes('/join')
    ? `👉 List yourself free: ${link}`
    : `👉 Find someone near you: ${link}`
}

// Called every 10 minutes by a Supabase cron job. Once a scheduled post is live,
// adds its website link as the first comment (posts carry "Link in the comments" instead of the URL).
export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.FB_JOB_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const token = process.env.META_PAGE_ACCESS_TOKEN!
  const { data: pending } = await supabaseAdmin.from('fb_link_comments').select('post_id, link').is('commented_at', null)

  const done: string[] = []
  for (const row of pending ?? []) {
    const post = await fetch(`${API}${row.post_id}?fields=is_published&access_token=${token}`).then(r => r.json())
    if (!post.is_published) continue
    const res = await fetch(`${API}${row.post_id}/comments`, {
      method: 'POST',
      body: new URLSearchParams({ message: commentText(row.link), access_token: token }),
    }).then(r => r.json())
    if (res.id) {
      await supabaseAdmin.from('fb_link_comments').update({ commented_at: new Date().toISOString(), comment_id: res.id }).eq('post_id', row.post_id)
      done.push(row.post_id)
    } else {
      console.error('first comment failed', row.post_id, res.error?.message)
    }
  }
  return NextResponse.json({ commented: done.length })
}
