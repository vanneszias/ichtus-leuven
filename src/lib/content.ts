import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'

import { eventDetailHref } from '@/lib/events'
import type { Event, Page, SiteSetting } from '@/payload-types'

export type Locale = 'nl' | 'en'

export const locales: Locale[] = ['nl', 'en']

export const PUBLIC_CONTENT_CACHE_SECONDS = {
  events: 60,
  pages: 60,
  settings: 300,
} as const

export function publicLocale(locale: Locale) {
  return { fallbackLocale: false as const, locale }
}

const fallbackSettings: SiteSetting = {
  id: 0,
  siteName: 'Ichtus Leuven',
  navigation: [],
  updatedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
}

export class ContentUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ContentUnavailableError'
  }
}

function unavailable(message: string, error: unknown): null {
  if (process.env.NODE_ENV !== 'production') return null
  throw new ContentUnavailableError(message, { cause: error })
}

async function querySiteSettings(locale: Locale): Promise<SiteSetting> {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'site-settings', ...publicLocale(locale) })
}

const getCachedSiteSettings = unstable_cache(querySiteSettings, ['public-site-settings'], {
  revalidate: PUBLIC_CONTENT_CACHE_SECONDS.settings,
  tags: ['site-settings'],
})

export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSetting> => {
  try {
    return await getCachedSiteSettings(locale)
  } catch (error) {
    unavailable('Site Settings are unavailable', error)
    return fallbackSettings
  }
})

async function queryPage(locale: Locale, slug: string, draft: boolean): Promise<Page | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    ...publicLocale(locale),
    draft,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] || null
}

const getCachedPage = unstable_cache(
  (locale: Locale, slug: string) => queryPage(locale, slug, false),
  ['public-page'],
  { revalidate: PUBLIC_CONTENT_CACHE_SECONDS.pages, tags: ['pages'] },
)

const getMemoizedPage = cache(
  async (locale: Locale, slug: string, draft: boolean): Promise<Page | null> => {
    try {
      return draft ? await queryPage(locale, slug, true) : await getCachedPage(locale, slug)
    } catch (error) {
      unavailable(`Page '${slug}' is unavailable`, error)
      return null
    }
  },
)

export function getPage(locale: Locale, slug: string, draft = false): Promise<Page | null> {
  return getMemoizedPage(locale, slug, draft)
}

async function queryPageByID(pageID: number, locale: Locale, draft: boolean): Promise<Page> {
  const payload = await getPayload({ config })
  return payload.findByID({ collection: 'pages', id: pageID, ...publicLocale(locale), draft })
}

const getCachedPageByID = unstable_cache(
  (pageID: number, locale: Locale) => queryPageByID(pageID, locale, false),
  ['public-page-by-id'],
  { revalidate: PUBLIC_CONTENT_CACHE_SECONDS.pages, tags: ['pages'] },
)

const getMemoizedPageByID = cache((pageID: number, locale: Locale, draft: boolean) =>
  draft ? queryPageByID(pageID, locale, true) : getCachedPageByID(pageID, locale),
)

export async function getAlternatePageHref(
  pageID: number,
  locale: Locale,
  draft = false,
): Promise<string | null> {
  try {
    const page = await getMemoizedPageByID(pageID, locale, draft)
    if (!page.slug) return null
    // Never advertise an hreflang alternate that is unpublished or excluded
    // from search: crawlers report those as hreflang errors.
    if (!draft && page._status !== 'published') return null
    if (page.seo?.noIndex) return null
    return page.slug === 'home' ? `/${locale}` : `/${locale}/${page.slug}`
  } catch (error) {
    unavailable(`Alternate locale for Page ${pageID} is unavailable`, error)
    return null
  }
}

/**
 * The canonical detail path per locale for one Event. Slugs are localized, so
 * an Event translated in one locale only is advertised in that locale alone.
 */
async function queryEventLocaleHrefs(eventID: number): Promise<Partial<Record<Locale, string>>> {
  const hrefs: Partial<Record<Locale, string>> = {}
  try {
    const payload = await getPayload({ config })
    const translations = await Promise.all(
      locales.map(async (locale) => ({
        event: await payload.findByID({
          collection: 'events',
          fallbackLocale: false,
          id: eventID,
          locale,
        }),
        locale,
      })),
    )
    for (const { event, locale } of translations) {
      if (event._status !== 'published' || !event.title?.trim()) continue
      const link = eventDetailHref(event, locale)
      if (link && !link.external) hrefs[locale] = link.href
    }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status !== 404) unavailable(`Event translations for '${eventID}' are unavailable`, error)
  }
  return hrefs
}

export const getEventLocaleHrefs = cache(queryEventLocaleHrefs)

async function queryUpcomingEvents(locale: Locale, limit: number): Promise<Event[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'events',
    ...publicLocale(locale),
    limit,
    sort: 'startsAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { startsAt: { greater_than_equal: new Date().toISOString() } },
      ],
    },
  })
  return result.docs.filter((event) => Boolean(event.title?.trim()))
}

const getCachedUpcomingEvents = unstable_cache(queryUpcomingEvents, ['public-upcoming-events'], {
  revalidate: PUBLIC_CONTENT_CACHE_SECONDS.events,
  tags: ['events'],
})

export const getUpcomingEvents = cache(async (locale: Locale, limit: number): Promise<Event[]> => {
  try {
    return await getCachedUpcomingEvents(locale, limit)
  } catch (error) {
    unavailable('Upcoming Events are unavailable', error)
    return []
  }
})

async function queryEvent(locale: Locale, id: number): Promise<Event | null> {
  const payload = await getPayload({ config })
  const event = await payload.findByID({
    collection: 'events',
    id,
    ...publicLocale(locale),
    overrideAccess: true,
  })
  return event._status === 'published' && event.title?.trim() ? event : null
}

export const getEvent = cache(async (locale: Locale, eventID: string): Promise<Event | null> => {
  const id = Number(eventID)
  if (!Number.isInteger(id)) return null
  try {
    return await queryEvent(locale, id)
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 404) return null
    unavailable(`Event '${eventID}' is unavailable`, error)
    return null
  }
})

async function queryEventBySlug(locale: Locale, slug: string): Promise<Event | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'events',
    ...publicLocale(locale),
    limit: 1,
    overrideAccess: true,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  const event = result.docs[0]
  // Only Events that opted into their own page answer on the detail route;
  // the others deliberately live in the calendar without one.
  return event && (event.detail ?? 'page') === 'page' && event.title?.trim() ? event : null
}

export const getEventBySlug = cache(async (locale: Locale, slug: string): Promise<Event | null> => {
  if (!slug.trim()) return null
  try {
    return await queryEventBySlug(locale, slug)
  } catch (error) {
    unavailable(`Event '${slug}' is unavailable`, error)
    return null
  }
})

// The calendar is browsable by month, so it carries a window around today
// rather than the handful of upcoming Events the agenda pattern lists.
const CALENDAR_MONTHS_BEHIND = 12
const CALENDAR_MONTHS_AHEAD = 24
const CALENDAR_EVENT_LIMIT = 500

function calendarWindow(now: Date) {
  const from = new Date(now)
  from.setMonth(from.getMonth() - CALENDAR_MONTHS_BEHIND)
  const until = new Date(now)
  until.setMonth(until.getMonth() + CALENDAR_MONTHS_AHEAD)
  return { from: from.toISOString(), until: until.toISOString() }
}

async function queryCalendarEvents(locale: Locale): Promise<Event[]> {
  const payload = await getPayload({ config })
  const { from, until } = calendarWindow(new Date())
  const result = await payload.find({
    collection: 'events',
    ...publicLocale(locale),
    limit: CALENDAR_EVENT_LIMIT,
    sort: 'startsAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { startsAt: { greater_than_equal: from } },
        { startsAt: { less_than_equal: until } },
      ],
    },
  })
  return result.docs.filter((event) => Boolean(event.title?.trim()))
}

const getCachedCalendarEvents = unstable_cache(queryCalendarEvents, ['public-calendar-events'], {
  revalidate: PUBLIC_CONTENT_CACHE_SECONDS.events,
  tags: ['events'],
})

export const getCalendarEvents = cache(async (locale: Locale): Promise<Event[]> => {
  try {
    return await getCachedCalendarEvents(locale)
  } catch (error) {
    unavailable('Calendar Events are unavailable', error)
    return []
  }
})

export type SectionNavigation = {
  title: string
  items: { href: string; label: string }[]
}

async function querySectionChildren(rootID: number, locale: Locale): Promise<Page[]> {
  const payload = await getPayload({ config })
  const children = await payload.find({
    collection: 'pages',
    ...publicLocale(locale),
    depth: 0,
    pagination: false,
    sort: 'navigationOrder',
    where: { and: [{ parent: { equals: rootID } }, { _status: { equals: 'published' } }] },
  })
  return children.docs
}

const getCachedSectionChildren = unstable_cache(
  querySectionChildren,
  ['public-section-navigation'],
  {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS.pages,
    tags: ['pages'],
  },
)

const getMemoizedSectionChildren = cache((rootID: number, locale: Locale, draft: boolean) =>
  draft ? querySectionChildren(rootID, locale) : getCachedSectionChildren(rootID, locale),
)

export async function getSectionNavigation(
  page: Page,
  locale: Locale,
  draft = false,
): Promise<SectionNavigation | null> {
  try {
    const rootID = page.parent
      ? typeof page.parent === 'object'
        ? page.parent.id
        : page.parent
      : page.id
    const [root, children] = await Promise.all([
      rootID === page.id ? page : getMemoizedPageByID(rootID, locale, draft),
      getMemoizedSectionChildren(rootID, locale, draft),
    ])
    if (!children.length && !page.parent) return null
    const pages = [root, ...children]
    return {
      title: root.sectionTitle || root.title,
      items: pages.map((item) => ({
        href: `/${locale}/${item.slug === 'home' ? '' : item.slug}`,
        label: item.navigationLabel || item.title,
      })),
    }
  } catch (error) {
    unavailable(`Section navigation for Page ${page.id} is unavailable`, error)
    return null
  }
}
