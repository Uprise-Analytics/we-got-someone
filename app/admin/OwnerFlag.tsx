'use client'

import { useEffect } from 'react'

// Marks this browser as the owner's so your own visits and taps are not counted in the stats.
export default function OwnerFlag() {
  useEffect(() => {
    try { localStorage.setItem('wgs_owner', '1') } catch {}
  }, [])
  return null
}
