'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationSpinnerInner() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Hide spinner when navigation completes (pathname changes)
  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])

  // Show spinner when any internal link is clicked
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip external links, mailto, tel, anchors, and new-tab links
      if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('#')) return
      if (anchor.getAttribute('target') === '_blank') return
      setLoading(true)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-green-600 animate-spin" />
    </div>
  )
}

export default function NavigationSpinner() {
  return (
    <Suspense>
      <NavigationSpinnerInner />
    </Suspense>
  )
}
