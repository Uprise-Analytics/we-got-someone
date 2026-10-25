import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validUnsubscribeToken } from '@/lib/unsubscribe'

async function optOut(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('e')?.trim().toLowerCase() ?? ''
  const token = req.nextUrl.searchParams.get('t') ?? ''
  if (!email || !validUnsubscribeToken(email, token)) return false
  await supabaseAdmin.from('email_optouts').upsert({ email }, { onConflict: 'email' })
  return true
}

// One-click unsubscribe from the mail app's own button (RFC 8058).
export async function POST(req: NextRequest) {
  const ok = await optOut(req)
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}

// The "unsubscribe" link at the bottom of the email.
export async function GET(req: NextRequest) {
  const ok = await optOut(req)
  const body = ok
    ? '<h1>You are unsubscribed</h1><p>You won\'t get these emails from We Got Someone anymore. Your profile stays live.</p>'
    : '<h1>That link didn\'t work</h1><p>Reply to any of our emails with "unsubscribe" and we\'ll sort it out.</p>'
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribe | We Got Someone</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#F3F5F9;color:#1D294A;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">
<div style="max-width:440px;background:#fff;border-radius:16px;padding:32px;text-align:center;border-top:4px solid #2DAB64">${body}
<p><a href="https://www.wegotsomeone.co.za" style="color:#2DAB64;font-weight:bold;text-decoration:none">Back to We Got Someone</a></p></div></body></html>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
