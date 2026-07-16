'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DevActivateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleActivate() {
    setLoading(true)
    const res = await fetch('/api/dev/activate', { method: 'POST' })
    if (res.ok) {
      router.push('/join/success')
    } else {
      alert('Activation failed')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="w-full border border-gray-300 text-gray-500 text-sm py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? 'Activating...' : 'Skip payment (dev only)'}
    </button>
  )
}
