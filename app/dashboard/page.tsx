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

        {/* Analytics */}
        {(() => {
          const views = worker.profile_views ?? 0
          const taps = worker.whatsapp_taps ?? 0
          const rate = views > 0 ? Math.round((taps / views) * 100) : 0
          const message = taps > 0
            ? `${taps} ${taps === 1 ? 'person' : 'people'} reached out to you directly via WhatsApp`
            : views > 10
              ? 'People are viewing your profile. A strong photo and bio gets more contacts.'
              : views > 0
                ? 'Your profile is getting noticed. Keep it updated to attract more clients.'
                : 'Your profile is live. You will start getting views soon.'
          return (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Analytics</p>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">All time</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{views}</p>
                  <p className="text-xs text-gray-500 font-medium">Profile Views</p>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{taps}</p>
                  <p className="text-xs text-gray-500 font-medium">WhatsApp Contacts</p>
                </div>
              </div>

              {views > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-400">Contact rate</p>
                    <p className="text-xs font-bold text-gray-700">{rate}%</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
            </div>
          )
        })()}

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
