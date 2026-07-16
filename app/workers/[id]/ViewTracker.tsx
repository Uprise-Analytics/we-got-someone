'use client'

import { useEffect } from 'react'

export default function ViewTracker({ workerId }: { workerId: string }) {
  useEffect(() => {
    fetch('/api/workers/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId }),
    }).catch(() => {})
  }, [workerId])

  return null
}
