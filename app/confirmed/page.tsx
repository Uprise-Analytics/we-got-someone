'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function ConfirmedPage() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col items-center justify-center px-5 text-center">
      <Image
        src="/logo-white.png"
        alt="We Got Someone"
        width={360}
        height={90}
        className="h-20 sm:h-24 w-auto mb-12"
      />

      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-8">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Email confirmed!</h1>
      <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-8">
        Your account is now active. The device you signed up on will take you to your dashboard automatically.
      </p>

      {hasSession ? (
        <Link
          href="/dashboard"
          className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl text-base transition-colors"
        >
          Go to my dashboard
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl text-base transition-colors"
        >
          Sign in
        </Link>
      )}

      <p className="text-gray-700 text-xs mt-10">
        You can close this tab if you are already signed in on your other device.
      </p>
    </div>
  )
}
