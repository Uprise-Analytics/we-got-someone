import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import HeroSearch from '@/components/HeroSearch'
import WorkerMarquee from '@/components/WorkerMarquee'

const SKILL_CATEGORIES = [
  { label: 'Painter',         icon: '🎨' },
  { label: 'Cleaner',         icon: '🧹' },
  { label: 'Gardener',        icon: '🌿' },
  { label: 'Plumber',         icon: '🔧' },
  { label: 'Electrician',     icon: '⚡' },
  { label: 'Tiler',           icon: '🪟' },
  { label: 'Carpenter',       icon: '🪵' },
  { label: 'Handyman',        icon: '🔨' },
  { label: 'Domestic Worker', icon: '🏠' },
  { label: 'Brick Layer',     icon: '🧱' },
]

async function getFeaturedWorkers() {
  const { data } = await supabase
    .from('workers')
    .select('id, name, skills, photo_url, daily_rate, service_areas, city, available_now')
    .eq('is_active', true)
    .eq('available_now', true)
    .limit(10)
  return data ?? []
}

export default async function HomePage() {
  const featured = await getFeaturedWorkers()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar variant="public" />

      {/* ── Hero ── */}
      <section className="relative bg-[#0D1B2A] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-green-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 py-16 sm:py-28 md:py-40">
          <HeroSearch />
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-3 sm:gap-x-10">
          {[
            'Free to search',
            'No booking fees',
            'Contact workers directly',
            'Real ratings and reviews',
          ].map(text => (
            <span key={text} className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
              <span className="w-4 h-4 flex-shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── Skill categories ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">What do you need?</h2>
          <p className="text-gray-500 text-sm">Tap a category to browse available workers.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SKILL_CATEGORIES.map(({ label, icon }) => (
            <Link
              key={label}
              href={`/workers?skill=${encodeURIComponent(label)}`}
              className="flex flex-col items-center gap-2.5 bg-white border border-gray-200 rounded-2xl px-3 py-6 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <span className="text-3xl">{icon}</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Marquee ── */}
      {featured.length > 0 && (
        <section className="py-20 bg-gray-50 overflow-hidden">
          <div className="text-center mb-10 px-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              We Got <span className="text-green-600">Someone.</span>
            </h2>
            <p className="text-gray-500 text-sm">
              Workers available right now. Hover to pause.{' '}
              <Link href="/workers" className="text-green-600 font-semibold hover:underline">View all →</Link>
            </p>
          </div>
          <WorkerMarquee workers={featured} />
        </section>
      )}

      {/* ── How it works ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">How it works</h2>
          <p className="text-gray-500 text-sm">Find and contact a worker in 3 steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-6 left-1/4 right-1/4 h-px bg-gray-200 z-0" />
          {[
            { n: '1', title: 'Search',  body: 'Choose the skill you need and the area you are in. No account required.' },
            { n: '2', title: 'Browse',  body: 'See workers with photos, reviews, daily rates and availability.' },
            { n: '3', title: 'Contact', body: 'Tap WhatsApp or Call. You deal directly. No agency, no commission.' },
          ].map(step => (
            <div key={step.n} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center text-lg font-extrabold mb-5 shadow-md">
                {step.n}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Worker CTA ── */}
      <section className="bg-[#0D1B2A] text-white py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-green-500/20 text-green-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            For workers
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
            Get found by people<br />who need your skills.
          </h2>
          <p className="text-gray-400 text-base mb-8 leading-relaxed max-w-lg mx-auto">
            List your profile on We Got Someone for just{' '}
            <span className="text-white font-semibold">R99/month</span>. No commission, no jobs lost to a middleman. Clients find you and contact you directly.
          </p>
          <Link
            href="/join"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
          >
            List yourself for R99/month
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <Image src="/logo-white.png" alt="We Got Someone" width={360} height={240} className="h-28 sm:h-32 w-auto" />
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-gray-400">
            <Link href="/workers" className="hover:text-white transition-colors">Find a worker</Link>
            <Link href="/join" className="hover:text-white transition-colors">List yourself</Link>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <div className="w-16 h-px bg-white/10" />
          <span className="text-xs text-gray-600 text-center">© {new Date().getFullYear()} We Got Someone</span>
        </div>
      </footer>
    </div>
  )
}
