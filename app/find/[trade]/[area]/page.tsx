import { supabaseAdmin } from '@/lib/supabase-admin'
import { TRADE_SLUGS, AREA_SLUGS, TOP_TRADE_SLUGS } from '@/lib/trade-slugs'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateStaticParams() {
  const params: { trade: string; area: string }[] = []
  for (const trade of TOP_TRADE_SLUGS) {
    for (const area of Object.keys(AREA_SLUGS)) {
      params.push({ trade, area })
    }
  }
  return params
}

export async function generateMetadata(
  { params }: { params: Promise<{ trade: string; area: string }> }
): Promise<Metadata> {
  const { trade, area } = await params
  const skill = TRADE_SLUGS[trade]
  const city = AREA_SLUGS[area]
  if (!skill || !city) return {}
  return {
    title: `${skill} in ${city} — Find Workers Near You`,
    description: `Looking for a ${skill.toLowerCase()} in ${city}? Browse trusted local workers on We Got Someone. Contact directly via WhatsApp or call — no agency fees.`,
    alternates: { canonical: `/find/${trade}/${area}` },
    openGraph: {
      title: `${skill} in ${city} | We Got Someone`,
      description: `Find a trusted ${skill.toLowerCase()} in ${city}. Direct contact, no middleman, no commission.`,
    },
  }
}

type Worker = {
  id: string
  name: string
  skills: string[]
  photo_url: string | null
  city: string
  service_areas: string[] | null
  bio: string | null
  reviews: { rating: number }[]
}

export default async function TradeAreaPage(
  { params }: { params: Promise<{ trade: string; area: string }> }
) {
  const { trade, area } = await params
  const skill = TRADE_SLUGS[trade]
  const city = AREA_SLUGS[area]
  if (!skill || !city) notFound()

  const { data } = await supabaseAdmin
    .from('workers')
    .select('id, name, skills, photo_url, city, service_areas, bio, reviews(rating)')
    .eq('is_active', true)
    .contains('skills', [skill])
    .or(`city.ilike.%${city}%,service_areas.cs.{${city}}`)
    .limit(30)

  const workers: Worker[] = (data ?? []).map((w: any) => ({
    ...w,
    reviews: w.reviews ?? [],
  }))

  const avgRating = (w: Worker) =>
    w.reviews.length
      ? Math.round((w.reviews.reduce((s, r) => s + r.rating, 0) / w.reviews.length) * 10) / 10
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="public" />

      {/* ── Hero ── */}
      <section className="bg-[#0D1B2A] text-white px-5 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/find/${trade}`} className="hover:text-gray-300 transition-colors">{skill}</Link>
            <span>/</span>
            <span className="text-gray-300">{city}</span>
          </div>
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">We Got Someone</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">{skill} in {city}</h1>
          <p className="text-gray-400 text-sm max-w-lg">
            {workers.length > 0
              ? `${workers.length} verified ${skill.toLowerCase()} worker${workers.length !== 1 ? 's' : ''} serving ${city}. Contact directly — no agency, no commission.`
              : `Find a trusted ${skill.toLowerCase()} in ${city}. Contact directly — no agency, no commission.`
            }
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10">

        {workers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker pitch */}
            <div className="bg-[#0D1B2A] text-white rounded-2xl p-8">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">For {skill.toLowerCase()}s in {city}</p>
              <h2 className="text-2xl font-extrabold mb-3 leading-snug">
                Be the first {skill.toLowerCase()} listed in {city}.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                People in {city} are searching for {skill.toLowerCase()} workers right now. Get your profile up first and own the top spot.
              </p>
              <ul className="space-y-2 mb-7">
                {[
                  'Your own profile page on Google',
                  'Clients contact you directly by WhatsApp',
                  '30-day enquiry guarantee',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/join"
                className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
              >
                List yourself — first month free
              </Link>
              <p className="text-gray-600 text-xs mt-3">R59/month after that. Cancel any time.</p>
            </div>

            {/* Homeowner message */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">For homeowners</p>
                <h2 className="text-xl font-extrabold text-gray-900 mb-3 leading-snug">
                  No {skill.toLowerCase()}s in {city} yet.
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  We're growing fast. In the meantime, browse all available {skill.toLowerCase()} workers across South Africa.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href={`/find/${trade}`}
                  className="flex items-center justify-between w-full bg-gray-50 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:text-green-700 transition-all"
                >
                  All {skill.toLowerCase()}s in South Africa
                  <span className="text-gray-400">→</span>
                </Link>
                <Link
                  href={`/workers?skill=${encodeURIComponent(skill)}`}
                  className="flex items-center justify-between w-full bg-gray-50 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:text-green-700 transition-all"
                >
                  Search with filters
                  <span className="text-gray-400">→</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map(worker => {
              const displayAreas = worker.service_areas?.length ? worker.service_areas : [worker.city]
              const rating = avgRating(worker)
              return (
                <Link
                  key={worker.id}
                  href={`/workers/${worker.id}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all group flex flex-col"
                >
                  <div className="relative pt-6 pb-4 px-4 text-center border-b border-gray-100 bg-gray-50">
                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-sm mx-auto mb-2">
                      {worker.photo_url ? (
                        <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                          {worker.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-base leading-snug mb-0.5">{worker.name}</p>
                    {displayAreas.length > 0 && (
                      <p className="text-xs text-gray-400">
                        {displayAreas.slice(0, 2).join(' · ')}
                        {displayAreas.length > 2 ? ` +${displayAreas.length - 2}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {worker.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                    {worker.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-3">{worker.bio}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      {rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-sm font-bold text-gray-900">{rating}</span>
                          <span className="text-xs text-gray-400">({worker.reviews.length})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">New listing</span>
                      )}
                      <span className="text-xs font-semibold text-green-600 group-hover:underline">View profile →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {workers.length > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-gray-200 pt-8">
            <Link
              href={`/workers?skill=${encodeURIComponent(skill)}&area=${encodeURIComponent(city)}`}
              className="text-sm font-semibold text-green-600 hover:underline"
            >
              Browse all {skill.toLowerCase()} workers with filters →
            </Link>
            <Link
              href="/join"
              className="inline-block bg-[#0D1B2A] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Are you a {skill.toLowerCase()} in {city}? List yourself free
            </Link>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${skill} Workers in ${city}`,
            description: `Find trusted ${skill.toLowerCase()} workers in ${city}, South Africa.`,
            itemListElement: workers.slice(0, 10).map((w, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://www.wegotsomeone.co.za/workers/${w.id}`,
              name: w.name,
            })),
          }),
        }}
      />
    </div>
  )
}
