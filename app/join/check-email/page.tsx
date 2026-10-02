'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CheckEmailContent() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? 'your inbox'

  useEffect(() => {
    // When the user clicks the confirmation link (same browser, any tab),
    // Supabase fires SIGNED_IN and we immediately redirect to dashboard.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        router.push('/dashboard')
      }
    })

    // Also check if already signed in (e.g. page was refreshed after confirmation)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })

    return () => subscription.unsubscribe()
  }, [router])

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

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Waiting to be authorised</h1>
      <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-2">
        Please check your email
      </p>
      <p className="text-white font-semibold text-lg mb-4">{email}</p>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-10">
        Click the confirmation link in that email. This page will take you straight to your dashboard the moment it is confirmed — on any device in the same browser.
      </p>

      <div className="flex items-center gap-2 text-gray-600 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Waiting for confirmation...
      </div>

      <p className="text-gray-700 text-xs mt-8">
        Confirmed on a different device?{' '}
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
