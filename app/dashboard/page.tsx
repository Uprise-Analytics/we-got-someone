import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import SignOutButton from './SignOutButton'
import ShareProfile from './ShareProfile'
import ReferralCard from './ReferralCard'
import StatsPanel from './StatsPanel'
import { getWorkerStats } from '@/lib/worker-stats'
import Navbar from '@/components/Navbar'
import TradePattern from '@/components/TradePattern'
import { isOwnerEmail } from '@/lib/admin'
import { goLiveIfConfirmed } from '@/lib/go-live'
import { FACEBOOK_URL, FACEBOOK_ICON_PATH } from '@/lib/social'

async function getSession() {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await serverSupabase.auth.getUser()
  return { user, serverSupabase }
}

export default async function DashboardPage() {
  const { user, serverSupabase } = await getSession()
  if (!user) redirect('/sign-in')

  const { data: worker } = await serverSupabase
    .from('workers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!worker) redirect('/join')
  // Safety net: a confirmed worker whose profile never went live gets switched on here
  if (!worker.is_active) {
    await goLiveIfConfirmed(user.id)
    const { data: fresh } = await serverSupabase.from('workers').select('is_active').eq('id', worker.id).single()
    if (fresh) worker.is_active = fresh.is_active
  }

  const stats = await getWorkerStats(worker)
  const needsPhoto = !worker.photo_url
  const isLive = worker.is_active && !needsPhoto

  return (
    <div className="relative min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="dashboard" profileHref={`/workers/${worker.id}`} signOutSlot={<SignOutButton />} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {isOwnerEmail(user.email) && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-[#0D1B2A] text-white rounded-2xl px-5 py-4 mb-5 hover:bg-[#1D294A] transition-colors"
          >
            <span>
              <span className="block text-xs font-semibold text-green-400 uppercase tracking-widest">Only you can see this</span>
              <span className="font-semibold">Open the owner dashboard</span>
            </span>
            <span aria-hidden className="text-xl">→</span>
          </Link>
        )}

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl mb-5 text-center overflow-hidden">
          {worker.banner_url && (
            <div className="w-full h-32 sm:h-40 bg-gray-100 overflow-hidden">
              <img src={worker.banner_url} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shadow-sm mx-auto">
              {worker.photo_url ? (
                <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                  {worker.name[0]}
                </div>
              )}
            </div>
            {isLive && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Welcome back</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{worker.name}</h1>
          <div className="flex flex-col items-center gap-1 mb-4 text-sm text-gray-500">
            {(worker.service_areas?.length ? worker.service_areas : worker.city ? [worker.city] : []).length > 0 && (
              <span>
                {(worker.service_areas?.length ? worker.service_areas : [worker.city]).slice(0, 2).join(', ')}
                {(worker.service_areas?.length ?? 0) > 2 ? ` +${(worker.service_areas?.length ?? 0) - 2}` : ''}
              </span>
            )}
            {worker.phone && <span>{worker.phone}</span>}
          </div>
          <Link
            href="/dashboard/edit"
            className="inline-block w-full text-sm font-semibold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 py-2.5 rounded-xl transition-colors"
          >
            Edit profile
          </Link>
          </div>{/* end inner padding */}
        </div>

        {/* Status banner */}
        {worker.is_active && needsPhoto ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-5">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              <p className="font-semibold text-amber-900">Add a profile photo to go live</p>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed mb-3">
              Your profile is hidden from search until it has a photo of you or your logo. Clients want to see who they are hiring.
            </p>
            <Link
              href="/dashboard/edit"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Add your photo
            </Link>
          </div>
        ) : worker.is_active ? (
          <div className="bg-green-600 text-white rounded-2xl p-4 sm:p-5 mb-5 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse flex-shrink-0" />
            <div>
              <p className="font-semibold">Your profile is live</p>
              <p className="text-green-100 text-sm mt-0.5">People in your area can find and contact you.</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 text-white rounded-2xl p-5 sm:p-6 mb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
              <p className="font-semibold text-base">Profile not visible yet</p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your profile is saved. It will be reviewed and activated shortly.
            </p>
          </div>
        )}

        {/* Personal stats: only this worker's own numbers */}
        <StatsPanel stats={stats} />

        {/* Referral card — only shown when active and referral_code exists */}
        {isLive && worker.referral_code && (
          <ReferralCard code={worker.referral_code} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Skills card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Skills</p>
            {worker.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {worker.skills.map((s: string) => (
                  <span key={s} className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No skills added</p>
            )}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Profile</p>
          </div>

          {worker.bio ? (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-xl px-4 py-3">{worker.bio}</p>
          ) : (
            <p className="text-sm text-gray-400 mb-4 italic">No bio added. <Link href="/dashboard/edit" className="text-green-600 not-italic">Add one</Link> so clients know who you are.</p>
          )}

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
            <p className="text-xs text-gray-400 mb-2">Areas you work in</p>
            {worker.service_areas?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {worker.service_areas.map((a: string) => (
                  <span key={a} className="text-xs font-medium bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            ) : worker.city ? (
              <p className="font-medium text-gray-800">{worker.city}</p>
            ) : (
              <p className="text-gray-400 italic text-xs">No areas set. <Link href="/dashboard/edit" className="text-green-600 not-italic">Add them</Link></p>
            )}
          </div>
        </div>

        {/* Ranking tips */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">How to appear higher in search</p>
          <div className="space-y-2">
            {[
              { done: worker.available_now, text: 'Mark yourself Available Now when you\'re free. It jumps you to the top.' },
              { done: !!worker.photo_url, text: 'Add a profile photo' },
              { done: !!worker.banner_url, text: 'Add a banner photo of your work or premises' },
              { done: !!worker.bio, text: 'Write a short bio about yourself' },
              { done: (worker.work_photos?.length ?? 0) > 0, text: 'Upload work photos to show what you can do' },
              { done: false, text: 'Get your first review from a client' },
            ].map(({ done, text }) => (
              <div key={text} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? '✓' : ''}
                </span>
                <span className={done ? 'text-gray-400 line-through' : 'text-gray-700'}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Facebook */}
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-gray-300 transition-colors"
        >
          <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#1877F2] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d={FACEBOOK_ICON_PATH} /></svg>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-gray-900 text-sm">Follow us on Facebook</span>
            <span className="block text-xs text-gray-500">Share our posts so more clients in your area find you.</span>
          </span>
          <span aria-hidden className="text-gray-400">→</span>
        </a>

        {/* Support link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Need help?{' '}
            <Link href="/contact" className="text-green-600 font-semibold hover:underline">Contact us</Link>
          </p>
        </div>

        {isLive && (
          <div className="mt-4">
            <ShareProfile
              profileUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/workers/${worker.id}`}
              workerName={worker.name}
            />
          </div>
        )}

      </div>
    </div>
  )
}
