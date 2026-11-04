import { supabaseAdmin } from '@/lib/supabase-admin'

// Which /find pages actually have live workers. Empty pages are kept out of Google
// (noindex + left out of the sitemap) so the site isn't judged on thin content.
type LiveWorker = { skills: string[] | null; city: string | null; service_areas: string[] | null }

export async function liveWorkers(): Promise<LiveWorker[]> {
  const { data } = await supabaseAdmin
    .from('workers')
    .select('skills, city, service_areas')
    .eq('is_active', true)
    .not('photo_url', 'is', null)
  return (data ?? []) as LiveWorker[]
}

// A worker serves an area when their city or one of their service areas is that area,
// or a part of it ("Pretoria East" counts for Pretoria, "Johannesburg CBD" for Johannesburg).
export function servesArea(w: { city: string | null; service_areas: string[] | null }, area: string) {
  const a = area.toLowerCase()
  const matches = (place: string) => {
    const p = place.toLowerCase().trim()
    return p === a || p.startsWith(a + ' ')
  }
  return matches(w.city ?? '') || (w.service_areas ?? []).some(matches)
}

export function countFor(workers: LiveWorker[], skill: string, city?: string) {
  return workers.filter(w => w.skills?.includes(skill) && (!city || servesArea(w, city))).length
}
