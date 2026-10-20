'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

function CheckEmailContent() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? 'your inbox'
  const uid = params.get('uid')
  const redirected = useRef(false)

  function goToDashboard() {
    if (redirected.current) return
    redirected.current = true
    router.push('/dashboard')
  }

  useEffect(() => {
    // Same-browser path: Supabase fires SIGNED_IN the moment the tab that clicked
    // the link sets the session (same browser storage origin).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        goToDashboard()
      }
    })

    // In case the page is refreshed after confirmation.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goToDashboard()
    })

    // Cross-device path: poll every 5 s to detect confirmation from a different browser.
    // When confirmed, sign in with stored credentials and redirect.
    let pollTimer: ReturnType<typeof setInterval> | null = null
    if (uid) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/check-confirmed?uid=${uid}`)
          const { confirmed } = await res.json()
          if (confirmed) {
            // Try to sign in automatically using credentials stored in sessionStorage.
            const storedEmail = sessionStorage.getItem('wgs_email')
            const storedPassword = sessionStorage.getItem('wgs_password')
            if (storedEmail && storedPassword) {
              const { error } = await supabase.auth.signInWithPassword({
                email: storedEmail,
                password: storedPassword,
              })
              if (!error) {
                sessionStorage.removeItem('wgs_email')
                sessionStorage.removeItem('wgs_password')
                goToDashboard()
                return
              }
            }
            // Credentials not available — send to sign-in so they can log in manually.
            if (!redirected.current) {
              redirected.current = true
              router.push('/sign-in?confirmed=1')
            }
          }
        } catch {}
      }, 5000)
    }

    return () => {
      subscription.unsubscribe()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [router, uid])

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col items-center justify-center px-5 text-center">
      <Image
        src="/logo-white.png"
        alt="We Got Someone"
        width={360}
        height={90}
        className="h-20 sm:h-24 w-auto mb-12"
      />

      {/* Animated pulse ring */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <svg className="w-9 h-9 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Check your email</h1>
      <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-2">
        We sent a confirmation link to
      </p>
      <p className="text-white font-semibold text-lg mb-4">{email}</p>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-10">
        Click the link in that email. Once you confirm, this page will automatically take you to your dashboard.
      </p>

      <div className="flex items-center gap-2 text-gray-600 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Waiting for confirmation...
      </div>

      <p className="text-gray-700 text-xs mt-8">
        Already confirmed?{' '}
        <Link href="/sign-in" className="text-green-400 hover:text-green-300 underline">
          Sign in here
        </Link>
      </p>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
