import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import SignOutButton from './SignOutButton'
import DevActivateBanner from './DevActivateBanner'
import ShareProfile from './ShareProfile'
import CancelSubscriptionButton from './CancelSubscriptionButton'
import Navbar from '@/components/Navbar'
import TradePattern from '@/components/TradePattern'

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
    .select('*, subscriptions(status, next_billing_date), free_until')
    .eq('user_id', user.id)
    .single()

  if (!worker) redirect('/join')

  const subscription = worker.subscriptions?.[0]
  const firstName = worker.name.split(' ')[0]
  const freeUntil = worker.free_until ? new Date(worker.free_until) : null
  const daysLeft = freeUntil ? Math.max(0, Math.ceil((freeUntil.getTime() - Date.now()) / 86400000)) : null
  const onFreeTrial = daysLeft !== null && daysLeft > 0

  return (
    <div className="relative min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="dashboard" profileHref={`/workers/${worker.id}`} signOutSlot={<SignOutButton />} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 text-center">
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
            {worker.is_active && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Welcome back</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{firstName}</h1>
          <div className="flex flex-col items-center gap-1 mb-4 text-sm text-gray-500">
            {(worker.service_areas?.length ? worker.service_areas : worker.city ? [worker.city] : []).length > 0 && (
              <span>
                {(worker.service_areas?.length ? worker.service_areas : [worker.city]).slice(0, 2).join(', ')}
                {(worker.service_areas?.length ?? 0) > 2 ? ` +${(worker.service_areas?.length ?? 0) - 2}` : ''}
              </span>
            )}
            {worker.phone && <span>{worker.phone}</span>}
          </div>
          {(worker.profile_views ?? 0) > 0 && (
            <p className="text-xs text-gray-400 mb-3">
              <span className="font-semibold text-gray-700">{worker.profile_views}</span> profile view{worker.profile_views !== 1 ? 's' : ''}
            </p>
          )}
          <Link
            href="/dashboard/edit"
            className="inline-block w-full text-sm font-semibold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 py-2.5 rounded-xl transition-colors"
          >
            Edit profile
          </Link>
        </div>

        {/* Status banner */}
        {worker.is_active ? (
          <div className="bg-green-600 text-white rounded-2xl p-4 sm:p-5 mb-5 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse flex-shrink-0" />
            <div>
              <p className="font-semibold">Your profile is live</p>
              {onFreeTrial ? (
                <p className="text-green-100 text-sm mt-0.5">
                  Free trial: <span className="font-semibold text-white">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>. After that, R99/month to stay listed.
                </p>
              ) : (
                <p className="text-green-100 text-sm mt-0.5">People in your area can find and contact you.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 text-white rounded-2xl p-4 sm:p-5 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div>
                  <p className="font-semibold">Profile not visible yet</p>
                  <p className="text-gray-400 text-sm mt-0.5">Pay R99/month to go live and start getting clients.</p>
                </div>
              </div>
              <Link
                href="/join/payment"
                className="text-sm bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 whitespace-nowrap"
              >
                Go live for R99
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && <DevActivateBanner />}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Subscription card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Subscription</p>
            {subscription ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                    subscription.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-semibold text-gray-900">R99 / month</span>
                </div>
                {subscription.next_billing_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Next billing</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(subscription.next_billing_date).toLocaleDateString('en-ZA')}
                    </span>
                  </div>
                )}
                {subscription.status === 'active' && <CancelSubscriptionButton />}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No active subscription</p>
            )}
          </div>

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

        {/* Support link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Need help?{' '}
            <Link href="/contact" className="text-green-600 font-semibold hover:underline">Contact us</Link>
          </p>
        </div>

        {worker.is_active && (
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
