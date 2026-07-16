import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import WorkerSearch from './WorkerSearch'
import Navbar from '@/components/Navbar'
import TradePattern from '@/components/TradePattern'

const SKILLS = [
  'Painter', 'Cleaner', 'Gardener', 'Plumber', 'Electrician',
  'Tiler', 'Carpenter', 'Handyman', 'Domestic Worker', 'Brick Layer',
]

const RANK = ['Primary', 'Secondary', 'Tertiary']

type Worker = {
  id: string
  name: string
  bio: string
  skills: string[]
  city: string
  area: string
  photo_url: string | null
  daily_rate: number | null
  available_now: boolean
  avg_rating: number
  review_count: number
  gender: string | null
  date_of_birth: string | null
  languages: string[] | null
  own_transport: boolean
  years_experience: number | null
  service_areas: string[] | null
  work_photos: string[] | null
  created_at: string
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function completenessScore(w: Worker): number {
  const daysSinceJoined = (Date.now() - new Date(w.created_at).getTime()) / 86400000
  return (
    (w.photo_url ? 3 : 0) +
    (w.bio ? 2 : 0) +
    (w.daily_rate ? 1 : 0) +
    (w.work_photos?.length ? 2 : 0) +
    (w.review_count > 0 ? 3 : 0) +
    (w.own_transport ? 1 : 0) +
    (daysSinceJoined < 7 ? 5 : 0)
  )
}

async function getWorkers(skill?: string, area?: string, sort?: string, name?: string) {
  function applyFilters(q: any) {
    if (skill) q = q.contains('skills', [skill])
    if (area) q = q.or(`city.ilike.%${area}%,service_areas.cs.{${area}}`)
    if (name) q = q.ilike('name', `%${name}%`)
    return q
  }

  let { data, error } = await applyFilters(
    supabase
      .from('workers')
      .select(`id, name, bio, skills, city, area, photo_url, daily_rate, available_now, gender, date_of_birth, languages, own_transport, years_experience, service_areas, work_photos, created_at, reviews(rating)`)
      .eq('is_active', true)
  )

  if (error || !data) {
    const fallback = await applyFilters(
      supabase
        .from('workers')
        .select(`id, name, bio, skills, city, area, photo_url, daily_rate, available_now, created_at, reviews(rating)`)
        .eq('is_active', true)
    )
    if (fallback.error || !fallback.data) return []
    data = fallback.data
  }

  const workers = data.map((w: any) => ({
    ...w,
    avg_rating: w.reviews?.length
      ? Math.round((w.reviews.reduce((s: number, r: any) => s + r.rating, 0) / w.reviews.length) * 10) / 10
      : 0,
    review_count: w.reviews?.length ?? 0,
  })) as Worker[]

  if (sort === 'rating') return workers.sort((a, b) => b.avg_rating - a.avg_rating)
  if (sort === 'rate_low') return workers.sort((a, b) => (a.daily_rate ?? 99999) - (b.daily_rate ?? 99999))
  if (sort === 'rate_high') return workers.sort((a, b) => (b.daily_rate ?? 0) - (a.daily_rate ?? 0))

  const byScore = (a: Worker, b: Worker) => completenessScore(b) - completenessScore(a)
  const available = shuffleArr(workers.filter(w => w.available_now).sort(byScore))
  const others    = shuffleArr(workers.filter(w => !w.available_now).sort(byScore))
  return [...available, ...others]
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; area?: string; sort?: string; name?: string }>
}) {
  const { skill, area, sort, name } = await searchParams
  const workers = await getWorkers(skill, area, sort, name)

  return (
    <div className="relative min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="public" />

      <div className="relative max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {skill && area ? `${skill}s in ${area}` : skill ? `${skill}s` : area ? `Workers in ${area}` : 'Find a Worker'}
          </h1>
          {workers.length > 0 && (
            <p className="text-gray-500 text-sm">{workers.length} worker{workers.length !== 1 ? 's' : ''} found</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <WorkerSearch initialSkill={skill ?? ''} initialArea={area ?? ''} initialSort={sort ?? ''} initialName={name ?? ''} skills={SKILLS} />
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">No workers found</p>
            <p className="text-gray-400 text-sm">Try a different skill or area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map(worker => {
              const age = calcAge(worker.date_of_birth)
              const areas = worker.service_areas?.length ? worker.service_areas : [worker.city]
              return (
                <Link
                  key={worker.id}
                  href={`/workers/${worker.id}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all group flex flex-col"
                >
                  {/* Card top: photo centered, rate badge, availability */}
                  <div className={`relative pt-6 pb-4 px-4 text-center border-b border-gray-100 ${worker.available_now ? 'bg-green-50' : 'bg-gray-50'}`}>
                    {worker.daily_rate && (
                      <span className="absolute top-3 right-3 text-xs font-bold text-green-700 bg-white border border-green-200 px-2.5 py-1 rounded-full shadow-sm">
                        R{worker.daily_rate}/day
                      </span>
                    )}
                    <div className="relative inline-block mb-2">
                      <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-sm mx-auto">
                        {worker.photo_url ? (
                          <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                            {worker.name[0]}
                          </div>
                        )}
                      </div>
                      {worker.available_now && (
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-base leading-snug mb-0.5">{worker.name}</p>
                    {areas.length > 0 && (
                      <p className="text-xs text-gray-400">
                        {areas.slice(0, 2).join(' · ')}{areas.length > 2 ? ` +${areas.length - 2}` : ''}
                      </p>
                    )}
                    {worker.available_now && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-600">Available now</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {/* Skills */}
                    <div className="flex flex-col gap-1.5 mb-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      {worker.skills.slice(0, 3).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-600 w-16 flex-shrink-0">{RANK[i]}</span>
                          <span className="text-sm font-medium text-gray-800">{s}</span>
                        </div>
                      ))}
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {worker.gender && (
                        <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100">
                          {worker.gender}
                        </span>
                      )}
                      {age !== null && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {age} yrs
                        </span>
                      )}
                      {worker.years_experience != null && (
                        <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                          {worker.years_experience} yr{worker.years_experience !== 1 ? 's' : ''} exp
                        </span>
                      )}
                      {worker.own_transport && (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                          Transport
                        </span>
                      )}
                    </div>

                    {/* Languages */}
                    {worker.languages && worker.languages.length > 0 && (
                      <p className="text-xs text-gray-400 mb-3">
                        Speaks: <span className="text-gray-600">{worker.languages.slice(0, 3).join(', ')}{worker.languages.length > 3 ? ` +${worker.languages.length - 3}` : ''}</span>
                      </p>
                    )}

                    {/* Bio */}
                    {worker.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-3">{worker.bio}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      {worker.avg_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-sm font-bold text-gray-900">{worker.avg_rating}</span>
                          <span className="text-xs text-gray-400">({worker.review_count})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                      )}
                      <span className="text-xs font-bold text-green-600 group-hover:underline flex items-center gap-1">
                        View profile
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
