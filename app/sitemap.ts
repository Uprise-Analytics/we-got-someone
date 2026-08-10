import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

  // Every active worker profile gets its own sitemap entry
  // Google will index "John Smith – Painter in Pretoria" as a standalone search result
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

  return [...staticPages, ...workerPages]
}
