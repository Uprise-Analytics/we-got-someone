'use client'

import { useMemo, useState } from 'react'
import type { WorkerRow } from '@/lib/admin'

type Filter = 'attention' | 'all' | 'hidden' | 'top' | 'quiet'
type Sort = 'attention' | 'health' | 'views' | 'contacts' | 'joined' | 'name'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'attention', label: 'Needs attention' },
  { id: 'all', label: 'All' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'quiet', label: 'No contacts yet' },
  { id: 'top', label: 'Top performers' },
]

const LEVEL_STYLE = {
  critical: 'bg-red-50 text-red-700 ring-red-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  info: 'bg-slate-50 text-slate-600 ring-slate-200',
}

const levelRank = (w: WorkerRow) =>
  w.attention.some(a => a.level === 'critical') ? 3 : w.attention.some(a => a.level === 'warning') ? 2 : w.attention.length ? 1 : 0

function ago(date: string | null) {
  if (!date) return 'Never'
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (d <= 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d} days ago`
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function healthColor(score: number) {
  if (score >= 75) return 'bg-green-500'
  if (score >= 45) return 'bg-amber-400'
  return 'bg-red-400'
}

function nudgeMessage(w: WorkerRow) {
  const hi = w.firstName ? `Hi ${w.firstName}` : 'Hi there'
  const top = w.attention.slice(0, 2).map(a => a.nudge)
  const body = top.length
    ? `quick note from We Got Someone: ${top.join('. Also, ')}.`
    : 'thanks for being on We Got Someone! Your profile is looking great. Keep sharing your link so more clients find you.'
  return `${hi}, ${body}\n\nYou can update your profile here: https://www.wegotsomeone.co.za/dashboard/edit`
}

export default function WorkersTable({ workers, days }: { workers: WorkerRow[]; days: number }) {
  const [filter, setFilter] = useState<Filter>('attention')
  const [sort, setSort] = useState<Sort>('attention')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const counts = useMemo(() => {
    const real = workers.filter(w => !w.isOwner)
    return {
      attention: real.filter(w => levelRank(w) >= 2).length,
      all: workers.length,
      hidden: workers.filter(w => !w.live).length,
      quiet: real.filter(w => w.live && w.tapsAll === 0).length,
      top: real.filter(w => w.tapsAll > 0).length,
    }
  }, [workers])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = workers.filter(w => {
      if (q && !`${w.name} ${w.skills.join(' ')} ${w.areas.join(' ')} ${w.email ?? ''}`.toLowerCase().includes(q)) return false
      if (filter === 'attention') return !w.isOwner && levelRank(w) >= 2
      if (filter === 'hidden') return !w.live
      if (filter === 'quiet') return !w.isOwner && w.live && w.tapsAll === 0
      if (filter === 'top') return !w.isOwner && w.tapsAll > 0
      return true
    })
    const by: Record<Sort, (a: WorkerRow, b: WorkerRow) => number> = {
      attention: (a, b) => levelRank(b) - levelRank(a) || a.health - b.health,
      health: (a, b) => b.health - a.health,
      views: (a, b) => b.viewsAll - a.viewsAll,
      contacts: (a, b) => b.tapsAll - a.tapsAll || b.viewsAll - a.viewsAll,
      joined: (a, b) => b.joined.localeCompare(a.joined),
      name: (a, b) => a.name.localeCompare(b.name),
    }
    list = [...list].sort(by[filter === 'top' && sort === 'attention' ? 'contacts' : sort])
    return list
  }, [workers, filter, sort, query])

  const header = (id: Sort, label: string, className = '') => (
    <th className={`px-3 py-2.5 font-semibold ${className}`}>
      <button
        onClick={() => setSort(id)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide text-[11px] hover:text-gray-900 ${sort === id ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {label}{sort === id && <span aria-hidden>↓</span>}
      </button>
    </th>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setOpen(null) }}
              className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${filter === f.id ? 'bg-[#1D294A] text-white border-[#1D294A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {f.label} <span className={`tabular-nums ${filter === f.id ? 'text-white/70' : 'text-gray-400'}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, service, area"
          className="sm:ml-auto w-full sm:w-60 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-6 text-center">
          {filter === 'attention' ? 'Nobody needs urgent attention right now. Nice.' : 'No workers match.'}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {header('name', 'Worker', 'pl-5 sm:pl-3')}
                {header('health', 'Profile')}
                {header('views', 'Views', 'text-right')}
                {header('contacts', 'Contacts', 'text-right')}
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wide font-semibold text-gray-400 text-right">Reviews</th>
                {header('joined', 'Joined')}
                {header('attention', 'Status')}
              </tr>
            </thead>
            <tbody>
              {rows.map(w => {
                const isOpen = open === w.id
                const rate = w.viewsAll ? Math.round((w.tapsAll / w.viewsAll) * 100) : 0
                return (
                  <FragmentRow key={w.id}>
                    <tr
                      onClick={() => setOpen(isOpen ? null : w.id)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="pl-5 sm:pl-3 pr-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            {w.photo
                              ? <img src={w.photo} alt="" className="w-full h-full object-cover" />
                              : <span className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{w.name[0]}</span>}
                            <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${w.live ? 'bg-green-500' : 'bg-red-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]">
                              {w.name}{w.isOwner && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Yours</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">{w.skills.slice(0, 2).join(', ')}{w.skills.length > 2 ? ` +${w.skills.length - 2}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${healthColor(w.health)}`} style={{ width: `${w.health}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 tabular-nums">{w.health}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className="font-semibold text-gray-900">{w.viewsAll}</span>
                        {w.viewsPeriod > 0 && <span className="block text-[11px] text-green-600">+{w.viewsPeriod} in {days}d</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className="font-semibold text-gray-900">{w.tapsAll}</span>
                        {w.viewsAll > 0 && <span className="block text-[11px] text-gray-400">{rate}% of views</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {w.reviews ? <span className="font-semibold text-gray-900">{w.rating}<span className="text-yellow-400">★</span> <span className="text-gray-400 font-normal">({w.reviews})</span></span> : <span className="text-gray-300">None</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{ago(w.joined)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {w.attention.length === 0
                            ? <span className="text-xs font-medium px-2 py-0.5 rounded-full ring-1 bg-green-50 text-green-700 ring-green-200">All good</span>
                            : w.attention.slice(0, 2).map(a => (
                              <span key={a.text} className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${LEVEL_STYLE[a.level]}`}>{a.text}</span>
                            ))}
                          {w.attention.length > 2 && <span className="text-xs text-gray-400 px-1">+{w.attention.length - 2}</span>}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-green-50/50 border-b border-gray-100">
                        <td colSpan={7} className="px-5 sm:px-3 pb-4 pt-1">
                          <div className="sticky left-5 w-[calc(100vw-4.5rem)] sm:w-auto grid sm:grid-cols-[1fr_auto] gap-4 items-start">
                            <div className="space-y-2 text-sm">
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-gray-600">
                                <span><span className="text-gray-400">Areas:</span> {w.areas.join(', ') || 'None set'}</span>
                                <span><span className="text-gray-400">Phone:</span> {w.phone || 'None'}</span>
                                <span><span className="text-gray-400">Email:</span> {w.email || 'None'}</span>
                                <span><span className="text-gray-400">Last signed in:</span> {ago(w.lastSignIn)}</span>
                              </div>
                              {w.attention.length > 0 && (
                                <ul className="flex flex-wrap gap-1.5">
                                  {w.attention.map(a => (
                                    <li key={a.text} className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${LEVEL_STYLE[a.level]}`}>{a.text}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {w.waNumber && (
                                <a
                                  href={`https://wa.me/${w.waNumber}?text=${encodeURIComponent(nudgeMessage(w))}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl transition-colors"
                                >
                                  WhatsApp {w.attention.length ? 'a nudge' : 'thanks'}
                                </a>
                              )}
                              {w.email && (
                                <a
                                  href={`mailto:${w.email}?subject=${encodeURIComponent('Your We Got Someone profile')}&body=${encodeURIComponent(nudgeMessage(w))}`}
                                  className="text-sm font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3.5 py-2 rounded-xl transition-colors"
                                >
                                  Email
                                </a>
                              )}
                              <a
                                href={`/workers/${w.id}`} target="_blank" rel="noopener noreferrer"
                                className="text-sm font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3.5 py-2 rounded-xl transition-colors"
                              >
                                View profile
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">Tap a worker for details and a ready-made WhatsApp message based on what their profile is missing.</p>
    </div>
  )
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
