import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/sign-in'],
    },
    sitemap: 'https://www.wegotsomeone.co.za/sitemap.xml',
  }
}
