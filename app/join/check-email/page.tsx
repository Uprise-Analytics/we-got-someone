'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CheckEmailContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? 'your inbox'

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col items-center justify-center px-5 text-center">
      <Image src="/logo-white.png" alt="We Got Someone" width={360} height={90} className="h-20 sm:h-24 w-auto mb-12" />

      <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Check your email</h1>
      <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-2">
        We sent a confirmation link to
      </p>
      <p className="text-white font-semibold text-lg mb-6">{email}</p>
      <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-10">
        Click the link in the email to confirm your account. Once confirmed, you'll go straight to your dashboard — on any device.
      </p>

      <p className="text-gray-600 text-xs">
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
