import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReviewForm from './ReviewForm'
import ViewTracker from './ViewTracker'
import Navbar from '@/components/Navbar'
import PhotoLightbox from '@/components/PhotoLightbox'
import PhotoGallery from '@/components/PhotoGallery'
import TradePattern from '@/components/TradePattern'

async function getWorker(id: string) {
  const { data } = await supabaseAdmin
    .from('workers')
    .select('*, reviews(id, reviewer_name, rating, comment, created_at)')
    .eq('id', id)
    .single()
  return data
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}>{i <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

export default async function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const worker = await getWorker(id)
  if (!worker) notFound()

  const avgRating = worker.reviews?.length
    ? Math.round((worker.reviews.reduce((s: number, r: any) => s + r.rating, 0) / worker.reviews.length) * 10) / 10
    : 0

  const whatsappUrl = `https://wa.me/${worker.phone?.replace(/\D/g, '')}`
  const callUrl = `tel:${worker.phone}`

  function calcAge(dob: string | null): number | null {
    if (!dob) return null
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  const age = calcAge(worker.date_of_birth)

  return (
    <div className="relative min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="back" href="/workers" label="Back" />

      {!worker.is_active && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-amber-700 text-sm font-medium">This profile is not yet active.</p>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-5">

          {/* ── Profile header: centered on mobile, side-by-side on desktop ── */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6 mb-5 text-center sm:text-left">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
              {worker.photo_url ? (
                <PhotoLightbox src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                  {worker.name[0]}
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{worker.name}</h1>

              {(worker.service_areas?.length || worker.city) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mb-3">
                  {(worker.service_areas?.length ? worker.service_areas : [worker.city]).map((a: string) => (
                    <span key={a} className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5 mb-3 text-left max-w-xs mx-auto sm:mx-0">
                {worker.skills?.map((s: string, i: number) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600 w-16 flex-shrink-0">{['Primary', 'Secondary', 'Tertiary'][i]}</span>
                    <span className="text-sm font-medium text-gray-800">{s}</span>
                  </div>
                ))}
              </div>

              {avgRating > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <Stars rating={Math.round(avgRating)} />
                  <span className="font-medium">{avgRating}</span>
                  <span className="text-gray-400">({worker.reviews?.length} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Info badges ── */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-5">
            {worker.gender && (
              <span className="text-sm font-medium bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                {worker.gender}
              </span>
            )}
            {age !== null && (
              <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {age} yrs old
              </span>
            )}
            {worker.years_experience != null && (
              <span className="text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                {worker.years_experience} yr{worker.years_experience !== 1 ? 's' : ''} exp
              </span>
            )}
            {worker.own_transport && (
              <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 11l1.5-5h15L21 11M3 11h18M3 11l-1 4h20l-1-4" />
                </svg>
                Own transport
              </span>
            )}
            {worker.daily_rate && (
              <span className="text-sm font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full">
                R{worker.daily_rate}/day
              </span>
            )}
            {worker.available_now && (
              <span className="text-sm font-medium bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Available now
              </span>
            )}
          </div>

          {/* ── Languages ── */}
          {worker.languages && worker.languages.length > 0 && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-1.5 text-sm">Languages</h2>
              <p className="text-gray-600 text-sm">{worker.languages.join(', ')}</p>
            </div>
          )}

          {/* ── Bio ── */}
          {worker.bio && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-1.5">About</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{worker.bio}</p>
            </div>
          )}

          {/* ── Contact buttons ── */}
          {worker.phone && (
            <div className="flex gap-3 mb-6">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3.5 rounded-xl hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
              <a
                href={callUrl}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
                </svg>
                <span className="hidden sm:inline">Call</span>
              </a>
            </div>
          )}

          {/* ── Work photos ── */}
          {worker.work_photos && worker.work_photos.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Work Photos</h2>
              <PhotoGallery photos={worker.work_photos} />
            </div>
          )}

          {/* ── Reviews ── */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">
              Reviews {worker.reviews?.length > 0 && `(${worker.reviews.length})`}
            </h2>
            {worker.reviews?.length === 0 ? (
              <p className="text-gray-400 text-sm">No reviews yet. Be the first.</p>
            ) : (
              <div className="space-y-4">
                {worker.reviews?.map((r: any) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{r.reviewer_name}</p>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <ReviewForm workerId={worker.id} />
      </div>
      <ViewTracker workerId={worker.id} />
    </div>
  )
}
