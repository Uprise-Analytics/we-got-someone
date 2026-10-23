'use client'

import { useEffect } from 'react'
import { isOwnerBrowser, trackingIds } from '@/lib/track'

export default function ViewTracker({ workerId }: { workerId: string }) {
  useEffect(() => {
    if (isOwnerBrowser()) return
    fetch('/api/workers/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, path: location.pathname, referrer: document.referrer, ...trackingIds() }),
    }).catch(() => {})
  }, [workerId])

  return null
}
