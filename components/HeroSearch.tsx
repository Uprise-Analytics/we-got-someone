'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SA_TOWNS } from '@/components/AreaSelect'
import SearchableSelect from '@/components/SearchableSelect'

const SKILLS = [
  'Painter', 'Cleaner', 'Gardener', 'Plumber', 'Electrician',
  'Tiler', 'Carpenter', 'Handyman', 'Domestic Worker', 'Brick Layer',
]

const ROTATING = ['painter', 'cleaner', 'gardener', 'plumber', 'electrician', 'tiler', 'carpenter']

export default function HeroSearch() {
  const router = useRouter()
  const [skill, setSkill] = useState('')
  const [area, setArea] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING.length)
        setFading(false)
      }, 300)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  function search(overrideSkill?: string) {
    const params = new URLSearchParams()
    const s = overrideSkill ?? skill
    if (s) params.set('skill', s)
    if (area) params.set('area', area)
    router.push(`/workers?${params.toString()}`)
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 sm:mb-6">
        Need a{' '}
        <span
          className="text-green-400 inline-block transition-all duration-300"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(-10px)' : 'translateY(0)',
          }}
        >
          {ROTATING[wordIndex]}
        </span>
        ?<br />
        We Got <span className="text-green-400">Someone.</span>
      </h1>

      <p className="hidden sm:block text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
        Find trusted local workers near you. Contact them directly. No middleman, no fees.
      </p>

      {/* Mobile: just a Find Someone button */}
      <div className="sm:hidden mb-6 px-2">
        <button
          onClick={() => router.push('/workers')}
          className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-500/30"
        >
          Find someone
        </button>
      </div>

      {/* Desktop: full search card */}
      <div className="hidden sm:flex bg-white rounded-2xl shadow-2xl p-2 max-w-2xl mx-auto flex-row gap-2 mb-7">
        <SearchableSelect
          options={SKILLS}
          value={skill}
          onChange={setSkill}
          placeholder="What do you need?"
          className="flex-1"
          triggerClassName="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none"
        />

        <div className="w-px bg-gray-200 my-1.5" />

        <SearchableSelect
          options={SA_TOWNS}
          value={area}
          onChange={setArea}
          placeholder="Where? (select area)"
          className="flex-1"
          triggerClassName="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none"
        />

        <button
          onClick={() => search()}
          className="bg-green-500 hover:bg-green-400 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-colors"
        >
          Find someone
        </button>
      </div>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="text-gray-500 text-xs sm:text-sm self-center mr-1">Quick:</span>
        {['Painter', 'Cleaner', 'Gardener', 'Plumber', 'Electrician'].map(s => (
          <button
            key={s}
            onClick={() => search(s)}
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/50 hover:bg-white/5 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
