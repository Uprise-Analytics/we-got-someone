'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PromoCodeForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/promo/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push('/join/success')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2"
      >
        Have an invite code?
      </button>
    )
  }

  return (
    <form onSubmit={handleRedeem} className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-2">Enter your founder invite code</p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. FOUNDER-GS01"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono tracking-wide"
        />
        <button
          type="submit"
          disabled={loading || !code}
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-40"
        >
          {loading ? '...' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2">Valid codes give you 30 days free. No card needed.</p>
    </form>
  )
}
