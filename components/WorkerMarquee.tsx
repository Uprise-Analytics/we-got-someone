'use client'

import Link from 'next/link'

type Worker = {
  id: string
  name: string
  skills: string[]
  photo_url: string | null
  daily_rate: number | null
  service_areas: string[] | null
  city: string | null
  available_now: boolean
}

export default function WorkerMarquee({ workers }: { workers: Worker[] }) {
  if (!workers.length) return null

  // Repeat workers until one strip is at least 2400px wide (wider than any screen),
  // then duplicate that strip for a seamless loop: animation moves -50% = one strip width
  const CARD_W = 224 + 16 // w-56 + gap-4 in px
  const repeatCount = Math.max(Math.ceil(2400 / (workers.length * CARD_W)), 3)
  const strip = Array.from({ length: repeatCount }, () => workers).flat()
  const looped = [...strip, ...strip]
  const duration = Math.max(strip.length * 4, 30)

  return (
    <div
      className="overflow-hidden"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
    >
      <div
        className="flex gap-4"
        style={{
          width: 'max-content',
          animation: `wgs-marquee ${duration}s linear infinite`,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {looped.map((worker, i) => {
          const areas = (worker.service_areas?.length ? worker.service_areas : [worker.city]).filter(Boolean) as string[]
          return (
            <Link
              key={i}
              href={`/workers/${worker.id}`}
              className="w-56 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                    {worker.photo_url ? (
                      <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                        {worker.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{worker.name}</p>
                  {areas.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">{areas.slice(0, 2).join(' · ')}</p>
                  )}
                </div>
                {worker.daily_rate && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    R{worker.daily_rate}/day
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {worker.skills?.slice(0, 2).join(' · ')}
                  {(worker.skills?.length ?? 0) > 2 ? ` +${(worker.skills?.length ?? 0) - 2}` : ''}
                </span>
                <span className="text-xs font-semibold text-green-600 group-hover:underline">View →</span>
              </div>
            </Link>
          )
        })}
      </div>

      <style>{`
        @keyframes wgs-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
