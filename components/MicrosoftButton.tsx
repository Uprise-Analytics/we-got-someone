'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

// "Continue with Microsoft". Hidden until NEXT_PUBLIC_MICROSOFT_LOGIN=on; until then it only shows
// with ?ms=1 in the URL so it can be tested while the Microsoft app is being set up and verified.
export default function MicrosoftButton({ next }: { next: string }) {
  const [show, setShow] = useState(process.env.NEXT_PUBLIC_MICROSOFT_LOGIN === 'on')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('ms') === '1') setShow(true)
    } catch {}
  }, [])

  if (!show) return null

  async function go() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) {
      setError('Microsoft sign-in is not available right now. Please use your email instead.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-800 font-semibold py-3.5 rounded-xl hover:bg-gray-50 cursor-pointer disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 23 23" aria-hidden="true">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M12 1h10v10H12z" />
          <path fill="#00A4EF" d="M1 12h10v10H1z" />
          <path fill="#FFB900" d="M12 12h10v10H12z" />
        </svg>
        {loading ? 'Opening Microsoft...' : 'Continue with Microsoft'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}
