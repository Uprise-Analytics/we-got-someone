import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get More Work — List Yourself Free | We Got Someone',
  description: 'People near you are searching for your skills right now. Get your own profile page, appear on Google, and get found by clients directly. Free to list.',
  alternates: { canonical: '/for-workers' },
}

export default function ForWorkersPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">

      {/* ── Logo header ── */}
      <header className="flex justify-center pt-8 pb-4 px-6">
        <Image src="/logo-white.png" alt="We Got Someone" width={360} height={90} className="h-20 sm:h-24 w-auto" />
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-10 pb-16 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-4">For tradespeople & workers</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
            People near you are searching for<br />
            <span className="text-green-400">your skills right now.</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto">
            Get your own profile page and let clients in your area find you directly.
            No agency. No commission. No middleman.
          </p>
          <Link
            href="/join"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-extrabold px-10 py-4 rounded-2xl text-base transition-colors shadow-xl shadow-green-500/20"
          >
            Get listed — it's free
          </Link>
          <p className="text-gray-600 text-xs mt-4">No credit card. No contract.</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 pb-16 max-w-xl mx-auto">
        <h2 className="text-xl font-extrabold text-center mb-8">Three steps to get found</h2>
        <div className="space-y-4">
          {[
            { n: '1', title: 'Sign up in 2 minutes', body: 'Create your account with just your email. No card required.' },
            { n: '2', title: 'Build your profile', body: 'Add your skills, your areas, a photo, and a short bio. We show you exactly what clients see.' },
            { n: '3', title: 'Get found by clients', body: 'Your profile goes live on Google and our directory. Clients contact you directly by WhatsApp or call.' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center text-base font-extrabold flex-shrink-0">
                {step.n}
              </div>
              <div>
                <p className="font-bold text-white mb-1">{step.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 pb-16 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-extrabold mb-3">Ready to get more work?</h2>
        <p className="text-gray-400 text-sm mb-6">Join the workers already getting found in their area.</p>
        <Link
          href="/join"
          className="inline-block bg-green-500 hover:bg-green-400 text-white font-extrabold px-10 py-4 rounded-2xl text-base transition-colors shadow-xl shadow-green-500/20 mb-3"
        >
          Get listed — it's free
        </Link>
        <p className="text-gray-600 text-xs">No credit card. No contract.</p>
      </section>

    </div>
  )
}
