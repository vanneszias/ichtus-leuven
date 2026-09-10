import type { MetadataRoute } from 'next'

import { siteURL } from '@/lib/runtimeConfig'
import { isProductionDeployment } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeployment()) {
    return { rules: { disallow: '/', userAgent: '*' } }
  }

  const baseURL = siteURL()
  // A blanket /api/ disallow keeps every private Payload REST endpoint out of
  // search. The longer, more specific allow rule keeps media files crawlable
  // (RFC 9309 resolves conflicts by most-specific match).
  return {
    rules: {
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api/'],
      userAgent: '*',
    },
    sitemap: `${baseURL}/sitemap.xml`,
  }
}
