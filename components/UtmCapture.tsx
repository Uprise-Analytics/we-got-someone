'use client'
import { useEffect } from 'react'

export default function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
      for (const field of fields) {
        const val = params.get(field)
        if (val) sessionStorage.setItem(field, val)
      }
    } catch {}
  }, [])
  return null
}
