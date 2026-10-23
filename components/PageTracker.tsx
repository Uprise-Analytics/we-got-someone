'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'

// Records a page view on every page change, for the owner dashboard.
export default function PageTracker() {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    let referrer: string | undefined
    try {
      if (!sessionStorage.getItem('wgs_ref')) {
        sessionStorage.setItem('wgs_ref', '1')
        referrer = document.referrer || undefined
      }
    } catch {}
    track('page_view', { referrer })
  }, [pathname, search])

  return null
}
