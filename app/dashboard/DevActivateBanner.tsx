'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DevActivateBanner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function activate() {
    setLoading(true)
    const res = await fetch('/api/dev/activate', { method: 'POST' })
    if (res.ok) router.refresh()
    else setLoading(false)
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
      <span className="text-xs text-gray-500">Dev mode</span>
      <button
        onClick={activate}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-white underline disabled:opacity-50"
      >
        {loading ? 'Activating...' : 'Skip payment and activate'}
      </button>
    </div>
  )
}
