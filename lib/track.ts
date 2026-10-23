'use client'

// Anonymous visit tracking for the owner dashboard. A random id per browser (visitor) and per tab session.
type EventType = 'page_view' | 'profile_view' | 'whatsapp_tap' | 'search'

function randomId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function stored(storage: Storage, key: string) {
  let id = storage.getItem(key)
  if (!id) {
    id = randomId()
    storage.setItem(key, id)
  }
  return id
}

export function isOwnerBrowser() {
  try {
    return localStorage.getItem('wgs_owner') === '1'
  } catch {
    return false
  }
}

export function trackingIds() {
  try {
    return {
      visitorId: stored(localStorage, 'wgs_vid'),
      sessionId: stored(sessionStorage, 'wgs_sid'),
      utmSource: sessionStorage.getItem('utm_source') ?? undefined,
    }
  } catch {
    return {}
  }
}

export function track(type: EventType, data: Record<string, unknown> = {}) {
  if (isOwnerBrowser()) return
  const body = JSON.stringify({ type, path: location.pathname + location.search, ...trackingIds(), ...data })
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
