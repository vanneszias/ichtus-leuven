import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { locales } from '@/lib/content'
import { siteURL } from '@/lib/runtimeConfig'
import { createSitemapEntries, type LocalizedSitemapContent } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// Events remain listed for a short window after they start so late updates
// still get recrawled; older events drop out to keep the sitemap fresh.
const PAST_EVENT_RETENTION_DAYS = 30

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const eventCutoff = new Date(
    Date.now() - PAST_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
  const localizedContent = await Promise.all(
    locales.map(async (locale): Promise<LocalizedSitemapContent> => {
      const [pages, events] = await Promise.all([
        payload.find({
          collection: 'pages',
          depth: 0,
          fallbackLocale: false,
          locale,
          pagination: false,
          select: { id: true, seo: true, slug: true, updatedAt: true },
          where: { _status: { equals: 'published' } },
        }),
        payload.find({
          collection: 'events',
          depth: 0,
          fallbackLocale: false,
          locale,
          pagination: false,
          select: { id: true, detail: true, slug: true, title: true, updatedAt: true },
          where: {
            and: [
              { _status: { equals: 'published' } },
              { startsAt: { greater_than_equal: eventCutoff } },
            ],
          },
        }),
      ])
      return { events: events.docs, locale, pages: pages.docs }
    }),
  )

  return createSitemapEntries(siteURL(), localizedContent)
}
