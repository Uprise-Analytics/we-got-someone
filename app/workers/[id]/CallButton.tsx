'use client'

import { isOwnerBrowser, trackingIds } from '@/lib/track'

export default function CallButton({ phone, workerId }: { phone: string; workerId: string }) {
  function handleClick() {
    if (isOwnerBrowser()) return
    fetch('/api/workers/call-tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, path: location.pathname, ...trackingIds() }),
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <a
      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
      onClick={handleClick}
      className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
      </svg>
      <span className="hidden sm:inline">Call</span>
    </a>
  )
}
