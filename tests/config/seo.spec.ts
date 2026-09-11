import { describe, expect, it, vi } from 'vitest'

import manifest from '@/app/manifest'
import robots from '@/app/robots'
import {
  createAlternates,
  createEventStructuredData,
  createGlobalStructuredData,
  createSitemapEntries,
  createSocialMetadata,
  metadataRobots,
  resolveSocialImage,
  serializeJSONLD,
} from '@/lib/seo'
import type { Event } from '@/payload-types'

const environment = (APP_ENV?: string) => ({ APP_ENV })

describe('indexing policy', () => {
  it('protects every non-production environment and indexes production content', () => {
    expect(metadataRobots(false, environment('staging'))).toEqual({
      follow: false,
      index: false,
      noarchive: true,
    })
    expect(metadataRobots(false, environment())).toEqual({
      follow: false,
      index: false,
      noarchive: true,
    })
    expect(metadataRobots(false, environment('production'))).toMatchObject({
      follow: true,
      index: true,
    })
    expect(metadataRobots(true, environment('production'))).toEqual({
      follow: true,
      index: false,
    })
  })

  it('serves a restrictive staging robots policy and a media-safe production policy', () => {
    vi.stubEnv('APP_ENV', 'staging')
    expect(robots()).toEqual({ rules: { disallow: '/', userAgent: '*' } })

    vi.stubEnv('APP_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ichtus.example.org')
    const production = robots()
    expect(production.sitemap).toBe('https://ichtus.example.org/sitemap.xml')
    // Every private Payload REST endpoint stays out of search via the blanket
    // /api/ rule; the longer /api/media/file/ allow keeps images crawlable
    // (RFC 9309 most-specific-match resolution).
    expect(production.rules).toMatchObject({
      allow: expect.arrayContaining(['/api/media/file/']),
      disallow: expect.arrayContaining(['/admin', '/api/']),
    })
    vi.unstubAllEnvs()
  })
})

describe('localized metadata', () => {
  it('never invents an hreflang URL for a missing translation', () => {
    expect(createAlternates('/nl/alleen-nederlands', { nl: '/nl/alleen-nederlands' })).toEqual({
      canonical: '/nl/alleen-nederlands',
      languages: {
        nl: '/nl/alleen-nederlands',
        'x-default': '/nl/alleen-nederlands',
      },
    })
  })

  it('creates complete Open Graph and Twitter image metadata', () => {
    const image = resolveSocialImage(undefined, undefined, 'Ichtus Leuven', 'https://ichtus.be')
    const metadata = createSocialMetadata({
      alternateLocale: 'en',
      description: 'Student community',
      image,
      locale: 'nl',
      siteName: 'Ichtus Leuven',
      title: 'Welkom | Ichtus Leuven',
      url: '/nl',
    })
    expect(metadata.openGraph).toMatchObject({
      alternateLocale: 'en_GB',
      locale: 'nl_BE',
      siteName: 'Ichtus Leuven',
      url: '/nl',
    })
    // Social crawlers cannot render SVG, so the fallback card is a raster.
    expect([metadata.openGraph?.images].flat()[0]).toMatchObject({
      alt: 'Ichtus Leuven',
      height: 630,
      type: 'image/jpeg',
      url: 'https://ichtus.be/logos/social-card.jpg',
      width: 1200,
    })
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' })
  })
})

describe('sitemap contract', () => {
  it('filters localized noIndex and missing translations while including public events', () => {
    const sitemap = createSitemapEntries('https://ichtus.be', [
      {
        events: [
          {
            id: 10,
            slug: 'startavond',
            title: 'Startavond',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
          {
            id: 11,
            slug: 'enkel-nederlands',
            title: 'Enkel Nederlands',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
          {
            detail: 'external',
            id: 12,
            title: 'Elders aangekondigd',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
          // An activity of Ichtus Vlaanderen forwards to their site, so the
          // page it would have had here is not ours to index.
          {
            eventType: 'vlaanderen',
            id: 13,
            slug: 'quiztus-ichtus-vlaanderen',
            title: 'Quiztus Ichtus Vlaanderen',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
        ],
        locale: 'nl',
        pages: [
          { id: 1, slug: 'home', updatedAt: '2026-08-30T10:00:00.000Z' },
          {
            id: 2,
            seo: { noIndex: true },
            slug: 'verborgen',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
          { id: 3, slug: 'alleen-nl', updatedAt: '2026-08-30T10:00:00.000Z' },
        ],
      },
      {
        events: [
          {
            id: 10,
            slug: 'opening-night',
            title: 'Opening night',
            updatedAt: '2026-08-30T10:00:00.000Z',
          },
          { id: 11, slug: null, title: null, updatedAt: '2026-08-30T10:00:00.000Z' },
        ],
        locale: 'en',
        pages: [
          { id: 1, slug: 'home', updatedAt: '2026-08-30T10:00:00.000Z' },
          { id: 2, slug: 'hidden', updatedAt: '2026-08-30T10:00:00.000Z' },
          { id: 3, slug: null, updatedAt: '2026-08-30T10:00:00.000Z' },
        ],
      },
    ])

    expect(sitemap.map(({ url }) => url)).toEqual([
      'https://ichtus.be/nl',
      'https://ichtus.be/nl/alleen-nl',
      'https://ichtus.be/nl/activities/startavond',
      'https://ichtus.be/nl/activities/enkel-nederlands',
      'https://ichtus.be/en',
      'https://ichtus.be/en/hidden',
      'https://ichtus.be/en/activities/opening-night',
    ])
    expect(sitemap[1].alternates?.languages).toEqual({
      nl: 'https://ichtus.be/nl/alleen-nl',
      'x-default': 'https://ichtus.be/nl/alleen-nl',
    })
    expect(sitemap[2].alternates?.languages).toEqual({
      en: 'https://ichtus.be/en/activities/opening-night',
      nl: 'https://ichtus.be/nl/activities/startavond',
      'x-default': 'https://ichtus.be/nl/activities/startavond',
    })
    expect(JSON.stringify(sitemap)).not.toContain('verborgen')
    expect(JSON.stringify(sitemap)).not.toContain('quiztus')
  })
})

describe('structured data and application identity', () => {
  it('publishes Organization and WebSite nodes safely', () => {
    const serialized = serializeJSONLD(createGlobalStructuredData('https://ichtus.be'))
    const graph = JSON.parse(serialized)['@graph']
    expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual([
      'Organization',
      'WebSite',
    ])
    expect(graph[0].logo.url).toBe('https://ichtus.be/logos/ichtus-leuven-crest.svg')
  })

  it('publishes complete Event data and registration availability', () => {
    const event: Event = {
      _status: 'published',
      createdAt: '2026-08-30T10:00:00.000Z',
      endsAt: '2026-09-10T21:00:00.000Z',
      id: 42,
      location: 'Studentencentrum Leuven',
      registrationMode: 'internal',
      slug: 'startavond',
      startsAt: '2026-09-10T19:00:00.000Z',
      title: 'Startavond',
      updatedAt: '2026-08-30T10:00:00.000Z',
      waitlistEnabled: true,
    }
    const image = resolveSocialImage(undefined, undefined, 'Ichtus Leuven', 'https://ichtus.be')
    const data = createEventStructuredData({
      availability: 'open',
      baseURL: 'https://ichtus.be',
      description: 'Ontdek Ichtus Leuven.',
      event,
      image,
      isFull: true,
      locale: 'nl',
      url: '/nl/activities/startavond',
    })

    expect(data).toMatchObject({
      '@type': 'Event',
      // Stored UTC instants are exposed with the Brussels offset so rich
      // results show local times.
      endDate: '2026-09-10T23:00:00+02:00',
      image: ['https://ichtus.be/logos/social-card.jpg'],
      inLanguage: 'nl-BE',
      isAccessibleForFree: true,
      location: { '@type': 'Place', name: event.location },
      name: event.title,
      offers: {
        availability: 'https://schema.org/LimitedAvailability',
        price: 0,
        priceCurrency: 'EUR',
      },
      // Rich-results validators do not merge @id references across scripts.
      organizer: { '@type': 'Organization', name: 'Ichtus Leuven', url: 'https://ichtus.be' },
      startDate: '2026-09-10T21:00:00+02:00',
      url: 'https://ichtus.be/nl/activities/startavond',
    })
  })

  it('declares installable icon assets in the manifest', () => {
    expect(manifest()).toMatchObject({
      icons: [
        { sizes: '512x512', src: '/icon.png', type: 'image/png' },
        { sizes: '192x192', src: '/icon-192.png', type: 'image/png' },
        { purpose: 'maskable', sizes: '512x512', src: '/icon-maskable-512.png', type: 'image/png' },
        { sizes: '180x180', src: '/apple-icon.png', type: 'image/png' },
      ],
      start_url: '/nl',
    })
  })
})
