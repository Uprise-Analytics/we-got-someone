'use client'

import { useEffect } from 'react'
import { track } from '@/lib/track'

// Records what people searched for and how many workers they found, so gaps in supply show on the owner dashboard.
export default function SearchTracker({ trade, area, results }: { trade?: string; area?: string; results: number }) {
  useEffect(() => {
    if (!trade && !area) return
    track('search', { trade, area, results })
  }, [trade, area, results])

  return null
}
