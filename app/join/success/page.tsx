import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "You're Listed | We Got Someone",
  description: "Your profile is live on We Got Someone. Clients in your area can now find and contact you directly.",
}

export default function JoinSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col items-center justify-center px-5 text-center">

      <Image src="/logo-white.png" alt="We Got Someone" width={360} height={90} className="h-20 sm:h-24 w-auto mb-12" />

      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">You're registered!</h1>
      <p className="text-gray-400 text-base sm:text-lg max-w-sm leading-relaxed mb-8">
        Your profile is live. Clients in your area can now find and contact you directly.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
        >
          Go to your dashboard
        </Link>
        <Link
          href="/workers"
          className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-colors"
        >
          See all workers
        </Link>
      </div>
    </div>
  )
}
