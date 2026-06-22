import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api',
          '/teacher',
          '/students',
          '/payments',
          '/expenses',
          '/classes',
          '/ai',
          '/attendance',
          '/leaves',
          '/profile',
          '/how-to-use',
        ],
      },
    ],
    sitemap: 'https://school-fee-app.vercel.app/sitemap.xml',
  }
}
