'use client'

import { useState, useRef, useEffect } from 'react'

export const SA_TOWNS = [
  // Gauteng — East Rand
  'Alberton', 'Bedfordview', 'Benoni', 'Boksburg', 'Brakpan',
  'Edenvale', 'Germiston', 'Heidelberg', 'Kempton Park', 'Nigel', 'Springs',
  // Gauteng — Johannesburg
  'Braamfontein', 'Ferndale', 'Fourways', 'Johannesburg CBD', 'Melville',
  'Midrand', 'Northcliff', 'Northgate', 'Parktown', 'Randburg',
  'Roodepoort', 'Rosebank', 'Sandton', 'Soweto',
  // Gauteng — West Rand
  'Carletonville', 'Krugersdorp', 'Randfontein', 'Westonaria',
  // Gauteng — Pretoria / Tshwane
  'Atteridgeville', 'Centurion', 'Hatfield', 'Irene', 'Mamelodi',
  'Menlyn', 'Pretoria CBD', 'Pretoria East', 'Pretoria North', 'Pretoria West', 'Sunnyside',
  // Vaal Triangle
  'Sasolburg', 'Vanderbijlpark', 'Vereeniging',
  // KwaZulu-Natal
  'Amanzimtoti', 'Ballito', 'Durban', 'Empangeni', 'Hillcrest',
  'Pinetown', 'Pietermaritzburg', 'Richards Bay', 'Umhlanga', 'Westville',
  // Western Cape
  'Bellville', 'Cape Town', 'Fish Hoek', 'George', 'Knysna',
  'Milnerton', 'Parow', 'Somerset West', 'Stellenbosch', 'Paarl', 'Worcester',
  // Eastern Cape
  'East London', 'Gqeberha (Port Elizabeth)', 'Grahamstown', "King William's Town", 'Queenstown',
  // Free State
  'Bloemfontein', 'Botshabelo', 'Kroonstad', 'Welkom',
  // Mpumalanga
  'Middelburg', 'Nelspruit', 'Secunda', 'Witbank',
  // Limpopo
  'Louis Trichardt', 'Mokopane', 'Phalaborwa', 'Polokwane', 'Tzaneen',
  // North West
  'Brits', 'Klerksdorp', 'Mafikeng', 'Potchefstroom', 'Rustenburg',
  // Northern Cape
  'Kimberley', 'Upington',
  // Garden Route / Other
  'Mossel Bay', 'Oudtshoorn', 'Beaufort West',
].sort()

export default function AreaSelect({
  selected,
  onChange,
  label = 'Areas you work in',
  placeholder = 'Search a town or city...',
}: {
  selected: string[]
  onChange: (areas: string[]) => void
  label?: string
  placeholder?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const filtered = SA_TOWNS.filter(
    t => t.toLowerCase().includes(search.toLowerCase()) && !selected.includes(t)
  )

  function add(town: string) {
    onChange([...selected, town])
    setSearch('')
  }

  function remove(town: string) {
    onChange(selected.filter(t => t !== town))
  }

  return (
    <div ref={ref} className="relative">
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(town => (
            <span
              key={town}
              className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full"
            >
              {town}
              <button
                type="button"
                onClick={() => remove(town)}
                className="cursor-pointer hover:text-green-900 leading-none ml-0.5 text-base"
                aria-label={`Remove ${town}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(town => (
              <button
                key={town}
                type="button"
                onClick={() => { add(town); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl"
              >
                {town}
              </button>
            ))
          ) : search ? (
            <p className="px-4 py-3 text-sm text-gray-400">No results for "{search}"</p>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400">All towns already selected</p>
          )}
        </div>
      )}

      {selected.length === 0 && !open && (
        <p className="text-xs text-gray-400 mt-1.5">Select all towns where you are available to work</p>
      )}
    </div>
  )
}
