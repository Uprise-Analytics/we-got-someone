import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get More Work — List Yourself Free | We Got Someone',
  description: 'People near you are searching for your skills right now. Get your own profile page, appear on Google, and get found by clients directly. First month free, then R59/month.',
  alternates: { canonical: '/for-workers' },
}

const VALUE_STACK = [
  { label: 'Your own professional profile page',           value: 'R600/month' },
  { label: 'Appear in Google Search for your trade + area', value: 'R800/month' },
  { label: 'WhatsApp & call button — clients reach you directly', value: 'R200/month' },
  { label: 'Photo gallery to show off your best work',     value: 'R300/month' },
  { label: 'Star ratings & reviews that build your reputation', value: 'R400/month' },
  { label: 'Listed across multiple service areas',         value: 'R200/month' },
  { label: 'Profile view counter — see your monthly reach', value: 'R100/month' },
]

export default function ForWorkersPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">

      {/* ── Logo header ── */}
      <header className="flex justify-center pt-8 pb-4 px-6">
        <Image src="/logo-white.png" alt="We Got Someone" width={200} height={60} className="h-12 w-auto" />
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
            Get listed — first month free
          </Link>
          <p className="text-gray-600 text-xs mt-4">No contract. Cancel any time.</p>
        </div>
      </section>

      {/* ── Value stack ── */}
      <section className="px-5 pb-16 max-w-xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-extrabold mb-1">Here's exactly what you get</h2>
          <p className="text-gray-400 text-sm mb-6">Everything included. No hidden costs.</p>

          <div className="space-y-3 mb-6">
            {VALUE_STACK.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-gray-200 leading-snug">{label}</span>
                </div>
                <span className="flex-shrink-0 text-xs font-semibold text-green-400">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Total value</span>
              <span className="line-through">R2,600/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Your price</span>
              <div>
                <span className="text-3xl font-extrabold text-green-400">R59</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-1">First month completely free. No contract. Cancel any time.</p>
          </div>

          {/* Guarantee */}
          <div className="flex items-start gap-3 border border-green-500/30 bg-green-500/10 rounded-xl px-4 py-3.5">
            <span className="text-xl mt-0.5">🛡️</span>
            <div>
              <p className="text-sm font-bold text-green-300">30-Day Enquiry Guarantee</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                If you don't receive a genuine client enquiry in your first 30 days, your second month is on us. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 pb-16 max-w-xl mx-auto">
        <h2 className="text-xl font-extrabold text-center mb-8">Three steps to get found</h2>
        <div className="space-y-4">
          {[
            { n: '1', title: 'Sign up in 2 minutes', body: 'Create your account with just your email. No card required for the free month.' },
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
          Get listed — first month free
        </Link>
        <p className="text-gray-600 text-xs">R59/month after that. No contract. Cancel any time.</p>
      </section>

    </div>
  )
}
