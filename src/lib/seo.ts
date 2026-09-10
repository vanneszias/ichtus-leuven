import type { Metadata, MetadataRoute } from 'next'

import type { Event, Media } from '@/payload-types'

export type SEOLocale = 'nl' | 'en'

const CREST_PATH = '/logos/ichtus-leuven-crest.svg'
const SOCIAL_CARD_PATH = '/logos/social-card.jpg'
const ORGANIZATION_ID = '#organization'
const WEBSITE_ID = '#website'

type Environment = Record<string, string | undefined>

export type SocialImage = {
  alt: string
  height: number
  type: string
  url: string
  width: number
}

type SitemapPage = {
  id: number
  seo?: { noIndex?: boolean | null } | null
  slug?: string | null
  updatedAt: string
}

type SitemapEvent = {
  detail?: Event['detail'] | null
  id: number
  slug?: string | null
  title?: string | null
  updatedAt: string
}

export type LocalizedSitemapContent = {
  events: SitemapEvent[]
  locale: SEOLocale
  pages: SitemapPage[]
}

export function isProductionDeployment(env: Environment = process.env) {
  return env.APP_ENV === 'production'
}

export function metadataRobots(
  editorialNoIndex = false,
  env: Environment = process.env,
): Metadata['robots'] {
  if (!isProductionDeployment(env)) {
    return { follow: false, index: false, noarchive: true }
  }
  if (editorialNoIndex) return { follow: true, index: false }
  return { follow: true, index: true, 'max-image-preview': 'large' }
}

export function absoluteURL(path: string, baseURL: string) {
  return new URL(path, `${baseURL.replace(/\/$/, '')}/`).href
}

export function createAlternates(
  canonical: string,
  localizedHrefs: Partial<Record<SEOLocale, string>>,
): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {}
  if (localizedHrefs.nl) languages.nl = localizedHrefs.nl
  if (localizedHrefs.en) languages.en = localizedHrefs.en
  languages['x-default'] = localizedHrefs.nl || localizedHrefs.en || canonical
  return { canonical, languages }
}

function populatedMedia(value: Event['image'] | undefined): Media | null {
  return value && typeof value === 'object' && value.url ? value : null
}

export function resolveSocialImage(
  selected: Event['image'] | undefined,
  defaultImage: Event['image'] | undefined,
  siteName: string,
  baseURL: string,
): SocialImage {
  const media = populatedMedia(selected) || populatedMedia(defaultImage)
  if (!media) {
    // Social crawlers (Facebook, LinkedIn, WhatsApp, X) do not render SVG
    // cards, so the fallback must stay a 1200x630 raster image.
    return {
      alt: siteName,
      height: 630,
      type: 'image/jpeg',
      url: absoluteURL(SOCIAL_CARD_PATH, baseURL),
      width: 1200,
    }
  }
  return {
    alt: media.alt || siteName,
    height: media.height || 630,
    type: media.mimeType || 'image/jpeg',
    url: absoluteURL(media.url, baseURL),
    width: media.width || 1200,
  }
}

export function createSocialMetadata(input: {
  alternateLocale?: SEOLocale
  description?: string
  image: SocialImage
  locale: SEOLocale
  siteName: string
  title: string
  url: string
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = {
    alt: input.image.alt,
    height: input.image.height,
    type: input.image.type,
    url: input.image.url,
    width: input.image.width,
  }
  // en_BE is not in the list of locales social consumers recognize; en_GB is.
  return {
    openGraph: {
      alternateLocale: input.alternateLocale
        ? input.alternateLocale === 'nl'
          ? 'nl_BE'
          : 'en_GB'
        : undefined,
      description: input.description,
      images: [image],
      locale: input.locale === 'nl' ? 'nl_BE' : 'en_GB',
      siteName: input.siteName,
      title: input.title,
      type: 'website',
      url: input.url,
    },
    twitter: {
      card: 'summary_large_image',
      description: input.description,
      images: [image],
      title: input.title,
    },
  }
}

export function localizedPath(locale: SEOLocale, slug: string) {
  return slug === 'home' ? `/${locale}` : `/${locale}/${slug}`
}

/**
 * Formats a stored UTC timestamp with the Europe/Brussels offset so
 * structured-data consumers show local event times instead of UTC.
 */
export function toBrusselsISO(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Brussels',
      timeZoneName: 'longOffset',
      year: 'numeric',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>
  const offset = parts.timeZoneName === 'GMT' ? '+00:00' : parts.timeZoneName.replace('GMT', '')
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}${offset}`
}

export function createSitemapEntries(
  baseURL: string,
  localizedContent: LocalizedSitemapContent[],
): MetadataRoute.Sitemap {
  const pageHrefs = new Map<number, Partial<Record<SEOLocale, string>>>()
  const eventHrefs = new Map<number, Partial<Record<SEOLocale, string>>>()

  for (const { events, locale, pages } of localizedContent) {
    for (const page of pages) {
      const slug = page.slug?.trim()
      if (!slug || page.seo?.noIndex) continue
      const hrefs = pageHrefs.get(page.id) || {}
      hrefs[locale] = localizedPath(locale, slug)
      pageHrefs.set(page.id, hrefs)
    }
    for (const event of events) {
      // Only Events with their own page are addressable; the rest live in the
      // calendar and would map onto a 404.
      if (!event.title?.trim() || (event.detail ?? 'page') !== 'page' || !event.slug?.trim())
        continue
      const hrefs = eventHrefs.get(event.id) || {}
      hrefs[locale] = `/${locale}/activities/${event.slug.trim()}`
      eventHrefs.set(event.id, hrefs)
    }
  }

  const languageAlternates = (hrefs: Partial<Record<SEOLocale, string>>) => {
    const languages = Object.fromEntries(
      Object.entries(hrefs).map(([language, localizedHref]) => [
        language,
        absoluteURL(localizedHref, baseURL),
      ]),
    )
    const fallback = hrefs.nl || hrefs.en
    if (fallback) languages['x-default'] = absoluteURL(fallback, baseURL)
    return languages
  }

  return localizedContent.flatMap(({ events, locale, pages }) => [
    ...pages.flatMap((page) => {
      const href = pageHrefs.get(page.id)?.[locale]
      if (!href) return []
      const hrefs = pageHrefs.get(page.id) || {}
      return [
        {
          alternates: {
            languages: languageAlternates(hrefs),
          },
          changeFrequency: 'weekly' as const,
          lastModified: page.updatedAt,
          priority: page.slug === 'home' ? 1 : 0.7,
          url: absoluteURL(href, baseURL),
        },
      ]
    }),
    ...events.flatMap((event) => {
      const href = eventHrefs.get(event.id)?.[locale]
      if (!href) return []
      const hrefs = eventHrefs.get(event.id) || {}
      return [
        {
          alternates: {
            languages: languageAlternates(hrefs),
          },
          changeFrequency: 'daily' as const,
          lastModified: event.updatedAt,
          priority: 0.8,
          url: absoluteURL(href, baseURL),
        },
      ]
    }),
  ])
}

export function createGlobalStructuredData(baseURL: string) {
  const organizationURL = `${baseURL}${ORGANIZATION_ID}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': organizationURL,
        '@type': 'Organization',
        logo: {
          '@type': 'ImageObject',
          height: 893,
          url: absoluteURL(CREST_PATH, baseURL),
          width: 700,
        },
        name: 'Ichtus Leuven',
        url: baseURL,
      },
      {
        '@id': `${baseURL}${WEBSITE_ID}`,
        '@type': 'WebSite',
        inLanguage: ['nl-BE', 'en-BE'],
        name: 'Ichtus Leuven',
        publisher: { '@id': organizationURL },
        url: baseURL,
      },
    ],
  }
}

export function createEventStructuredData(input: {
  availability: 'closed' | 'notOpen' | 'open'
  baseURL: string
  description?: string
  event: Event
  image: SocialImage
  isFull: boolean
  locale: SEOLocale
  url: string
}) {
  const eventURL = absoluteURL(input.url, input.baseURL)
  const location = input.event.location?.trim() || 'Leuven'
  let offer: Record<string, unknown> | undefined
  if (input.event.registrationMode === 'internal' || input.event.registrationMode === 'external') {
    let availability = 'https://schema.org/SoldOut'
    if (input.availability === 'notOpen') availability = 'https://schema.org/PreOrder'
    if (input.availability === 'open') {
      availability = input.isFull
        ? input.event.waitlistEnabled
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock'
    }
    const registrationURL =
      input.event.registrationMode === 'external' && input.event.registrationUrl
        ? input.event.registrationUrl
        : eventURL
    // Internal registrations never involve payment; external registrations
    // may, so a price is only asserted for the internal flow.
    const isFree = input.event.registrationMode === 'internal'
    offer = {
      '@type': 'Offer',
      availability,
      price: isFree ? 0 : undefined,
      priceCurrency: isFree ? 'EUR' : undefined,
      url: registrationURL,
      validFrom: input.event.registrationOpensAt || undefined,
      validThrough: input.event.registrationDeadline || input.event.startsAt,
    }
  }

  return {
    '@context': 'https://schema.org',
    '@id': `${eventURL}#event`,
    '@type': 'Event',
    description: input.description,
    endDate: input.event.endsAt ? toBrusselsISO(input.event.endsAt) : undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    image: [input.image.url],
    inLanguage: input.locale === 'nl' ? 'nl-BE' : 'en-BE',
    isAccessibleForFree: input.event.registrationMode === 'internal' || undefined,
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BE',
        addressLocality: 'Leuven',
        streetAddress: location,
      },
      name: location,
    },
    name: input.event.title,
    offers: offer,
    // Rich-results validators do not merge @id references across separate
    // JSON-LD scripts, so the organizer is inlined instead of referenced.
    organizer: {
      '@id': `${input.baseURL}${ORGANIZATION_ID}`,
      '@type': 'Organization',
      name: 'Ichtus Leuven',
      url: input.baseURL,
    },
    startDate: toBrusselsISO(input.event.startsAt),
    url: eventURL,
  }
}

export function serializeJSONLD(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
