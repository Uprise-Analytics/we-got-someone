import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { TRADE_SLUGS, TOP_TRADE_SLUGS, AREA_SLUGS } from '@/lib/trade-slugs'

const BASE_URL = 'https://www.wegotsomeone.co.za'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/workers`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/join`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/for-workers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ]

  // /find/[trade] — one page per skill
  const tradePages: MetadataRoute.Sitemap = Object.keys(TRADE_SLUGS).map(trade => ({
    url: `${BASE_URL}/find/${trade}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // /find/[trade]/[area] — top 10 trades × 15 cities = 150 pages
  const tradeAreaPages: MetadataRoute.Sitemap = []
  for (const trade of TOP_TRADE_SLUGS) {
    for (const area of Object.keys(AREA_SLUGS)) {
      tradeAreaPages.push({
        url: `${BASE_URL}/find/${trade}/${area}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      })
    }
  }

  // Individual worker profiles
  const { data: workers } = await supabaseAdmin
    .from('workers')
    .select('id, updated_at')
    .eq('is_active', true)

  const workerPages: MetadataRoute.Sitemap = (workers ?? []).map(w => ({
    url: `${BASE_URL}/workers/${w.id}`,
    lastModified: new Date(w.updated_at ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...tradePages, ...tradeAreaPages, ...workerPages]
}
