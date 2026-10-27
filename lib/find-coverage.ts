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

// Same matching as the /find pages: the skill, plus the area in their city or service areas.
export function countFor(workers: LiveWorker[], skill: string, city?: string) {
  return workers.filter(w => {
    if (!w.skills?.includes(skill)) return false
    if (!city) return true
    return (w.city ?? '').toLowerCase().includes(city.toLowerCase()) || (w.service_areas ?? []).includes(city)
  }).length
}
