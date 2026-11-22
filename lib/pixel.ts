'use client'

import { isOwnerBrowser } from '@/lib/track'

// Meta Pixel (Events Manager dataset "Pixel"). Used to measure and optimise Facebook ads.
export const META_PIXEL_ID = '1356517104689935'

type Fbq = (...args: unknown[]) => void

export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (isOwnerBrowser()) return
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  if (typeof fbq === 'function') fbq('track', event, params)
}
