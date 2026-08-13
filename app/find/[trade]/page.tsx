import { supabaseAdmin } from '@/lib/supabase-admin'
import { TRADE_SLUGS, AREA_SLUGS } from '@/lib/trade-slugs'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TradePattern from '@/components/TradePattern'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateStaticParams() {
  return Object.keys(TRADE_SLUGS).map(trade => ({ trade }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ trade: string }> }
): Promise<Metadata> {
  const { trade } = await params
  const skill = TRADE_SLUGS[trade]
  if (!skill) return {}
  return {
    title: `Find a ${skill} Near You in South Africa`,
    description: `Browse trusted ${skill.toLowerCase()} workers across South Africa. View profiles, contact directly via WhatsApp or call — no agency fees, no commission.`,
    alternates: { canonical: `/find/${trade}` },
    openGraph: {
      title: `${skill} Workers in South Africa | We Got Someone`,
      description: `Find a trusted ${skill.toLowerCase()} near you. Direct contact, no middleman.`,
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

export default async function TradePage(
  { params }: { params: Promise<{ trade: string }> }
) {
  const { trade } = await params
  const skill = TRADE_SLUGS[trade]
  if (!skill) notFound()

  const { data } = await supabaseAdmin
    .from('workers')
    .select('id, name, skills, photo_url, city, service_areas, bio, reviews(rating)')
    .eq('is_active', true)
    .contains('skills', [skill])
    .limit(30)

  const workers: Worker[] = (data ?? []).map((w: any) => ({
    ...w,
    reviews: w.reviews ?? [],
  }))

  const avgRating = (w: Worker) =>
    w.reviews.length
      ? Math.round((w.reviews.reduce((s, r) => s + r.rating, 0) / w.reviews.length) * 10) / 10
      : 0

  const areas = Object.values(AREA_SLUGS)

  return (
    <div className="relative min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="public" />

      <div className="relative max-w-5xl mx-auto px-5 py-10">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">We Got Someone</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
            {skill} in South Africa
          </h1>
          <p className="text-gray-500 text-sm">
            {workers.length} verified {skill.toLowerCase()} worker{workers.length !== 1 ? 's' : ''} available.
            Contact directly — no agency, no commission.
          </p>
        </div>

        {/* Area filter chips */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 w-max">
            {Object.entries(AREA_SLUGS).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/find/${trade}/${slug}`}
                className="flex-shrink-0 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-green-400 hover:text-green-600 rounded-full px-3.5 py-1.5 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Worker grid */}
        {workers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <p className="text-lg font-semibold text-gray-700 mb-1">No {skill.toLowerCase()} workers yet</p>
            <p className="text-gray-400 text-sm mb-6">Be the first to list yourself.</p>
            <Link
              href="/join"
              className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              List yourself — first month free
            </Link>
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

        {/* Browse all + CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-gray-200 pt-8">
          <Link
            href={`/workers?skill=${encodeURIComponent(skill)}`}
            className="text-sm font-semibold text-green-600 hover:underline"
          >
            Browse all {skill.toLowerCase()} workers with filters →
          </Link>
          <Link
            href="/join"
            className="inline-block bg-[#0D1B2A] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Are you a {skill.toLowerCase()}? List yourself free
          </Link>
        </div>

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `${skill} Workers in South Africa`,
              description: `Find trusted ${skill.toLowerCase()} workers near you in South Africa.`,
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
    </div>
  )
}
