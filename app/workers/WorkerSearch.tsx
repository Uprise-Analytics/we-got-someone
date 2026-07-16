'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SA_TOWNS } from '@/components/AreaSelect'
import SearchableSelect from '@/components/SearchableSelect'

export default function WorkerSearch({
  initialSkill,
  initialArea,
  initialSort,
  initialName,
  skills,
}: {
  initialSkill: string
  initialArea: string
  initialSort: string
  initialName: string
  skills: string[]
}) {
  const router = useRouter()
  const [skill, setSkill] = useState(initialSkill)
  const [area, setArea] = useState(initialArea)
  const [sort, setSort] = useState(initialSort)
  const [name, setName] = useState(initialName)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (skill) params.set('skill', skill)
    if (area) params.set('area', area)
    if (sort) params.set('sort', sort)
    if (name.trim()) params.set('name', name.trim())
    router.push(`/workers?${params.toString()}`)
  }

  function handleClear() {
    setSkill('')
    setArea('')
    setSort('')
    setName('')
    router.push('/workers')
  }

  const hasFilters = skill || area || sort || name.trim()

  return (
    <form onSubmit={handleSearch} className="space-y-2.5">
      {/* Row 1: skill + area */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <SearchableSelect
          options={skills}
          value={skill}
          onChange={setSkill}
          placeholder="All skills"
          className="flex-1"
          triggerClassName="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <SearchableSelect
          options={SA_TOWNS}
          value={area}
          onChange={setArea}
          placeholder="All areas"
          className="flex-1"
          triggerClassName="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white cursor-pointer"
        >
          <option value="">Sort: Available first</option>
          <option value="rating">Sort: Highest rated</option>
          <option value="rate_low">Sort: Rate low to high</option>
          <option value="rate_high">Sort: Rate high to low</option>
        </select>
      </div>

      {/* Row 2: name search + buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 whitespace-nowrap"
        >
          Search
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>
    </form>
  )
}
