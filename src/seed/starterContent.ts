import type { Payload, PayloadRequest } from 'payload'

import type { Page, SiteSetting } from '@/payload-types'
import { calendarStarterPage } from '@/seed/calendarPage'
import type { SeedMediaEntry } from '@/seed/mediaFiles'
import { seedMediaPath } from '@/seed/mediaFiles'
import { ensureSampleEvents } from '@/seed/sampleEvents'
import { seedMediaLibrary, starterPages, starterSiteSettings } from '@/seed/starter'
import type { SeedMediaFilename, SeedMediaIDs } from '@/seed/starter/media'

export type StarterLocale = 'nl' | 'en'

/** Page slugs, in every locale, mapped onto the identifiers of this database. */
export type StarterPageIDs = Record<string, number>

/**
 * Generated layouts mirror exactly what the database returned, including the
 * loose ends real editorial content carries. Payload validates them while
 * seeding, which is a truer check than the compiler can give a fixture.
 */
export type StarterLayout = Record<string, unknown>[]

export type StarterPageLocale = {
  layout: (media: SeedMediaIDs, pages: StarterPageIDs) => StarterLayout
  navigationLabel?: string | null
  sectionTitle?: string | null
  seo?: Record<string, unknown>
  slug: string
  title: string
}

export type StarterPage = {
  key: string
  locales: Record<StarterLocale, StarterPageLocale>
  navigationOrder?: number | null
  parentSlug?: string | null
}

export type StarterSiteSettingsData = Record<string, unknown>

export type StarterSiteSettings = Record<
  StarterLocale,
  (media: SeedMediaIDs, pages: StarterPageIDs) => StarterSiteSettingsData
>

type SiteSettingsInput = Partial<Omit<SiteSetting, 'createdAt' | 'id' | 'updatedAt'>>

const LOCALES: StarterLocale[] = ['nl', 'en']

/** A view that keeps the filename keys but relaxes the per-file field mix. */
const mediaLibrary: Record<SeedMediaFilename, SeedMediaEntry> = seedMediaLibrary

/**
 * Creates a media document per file in the generated library, re-using any
 * document that already carries the same filename, and returns the identifiers
 * the generated layouts look up.
 */
export async function ensureStarterMedia(
  payload: Payload,
  req?: PayloadRequest,
): Promise<SeedMediaIDs> {
  const filenames = Object.keys(seedMediaLibrary) as SeedMediaFilename[]
  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const entry = mediaLibrary[filename]
      const existing = await payload.find({
        collection: 'media',
        limit: 1,
        locale: 'nl',
        overrideAccess: true,
        req,
        where: { filename: { equals: filename } },
      })

      const media =
        existing.docs[0] ||
        (await payload.create({
          collection: 'media',
          filePath: seedMediaPath(filename),
          locale: 'nl',
          overrideAccess: true,
          req,
          data: {
            alt: entry.altNL,
            caption: entry.captionNL,
            capturedAt: entry.capturedAt,
            containsPeople: entry.containsPeople,
            focalPosition: entry.focalPosition,
            isDecorative: entry.isDecorative,
            publicationConsent: entry.publicationConsent,
            source: entry.source,
          },
        }))

      if (entry.altEN || entry.captionEN) {
        await payload.update({
          collection: 'media',
          id: media.id,
          locale: 'en',
          overrideAccess: true,
          req,
          data: { alt: entry.altEN, caption: entry.captionEN },
        })
      }

      return [filename, media.id] as const
    }),
  )

  return Object.fromEntries(entries) as SeedMediaIDs
}

/**
 * Pages the website needs to function, independent of what a content pull
 * captured. A generated page with the same slug always wins, so once editors
 * have published their own version the baseline stops applying.
 */
export const baselinePages: StarterPage[] = [calendarStarterPage]

export function seedPages(generated: StarterPage[] = starterPages): StarterPage[] {
  const claimed = new Set(
    generated.flatMap((page) =>
      LOCALES.flatMap((locale) => {
        const slug = page.locales[locale]?.slug
        return slug ? [slug] : []
      }),
    ),
  )
  const missing = baselinePages.filter(
    (page) => !LOCALES.some((locale) => claimed.has(page.locales[locale]?.slug)),
  )
  return [...generated, ...missing]
}

async function findPageID(
  payload: Payload,
  page: StarterPage,
  req?: PayloadRequest,
): Promise<number | undefined> {
  for (const locale of LOCALES) {
    const slug = page.locales[locale]?.slug
    if (!slug) continue
    const result = await payload.find({
      collection: 'pages',
      draft: true,
      limit: 1,
      locale,
      overrideAccess: true,
      req,
      where: { slug: { equals: slug } },
    })
    if (result.docs[0]) return result.docs[0].id
  }
  return undefined
}

/**
 * Copies the array row identifiers of an already saved document onto the
 * matching positions of an incoming one, so a later write updates the rows an
 * earlier one created rather than replacing them.
 */
function withArrayRowIDs(next: unknown, saved: unknown): unknown {
  if (Array.isArray(next)) {
    const rows: unknown[] = Array.isArray(saved) ? saved : []
    return next.map((row, index) => {
      const previous = rows[index]
      const merged = withArrayRowIDs(row, previous)
      const id =
        previous !== null && typeof previous === 'object'
          ? (previous as { id?: unknown }).id
          : undefined
      return id === undefined || merged === null || typeof merged !== 'object'
        ? merged
        : { ...(merged as Record<string, unknown>), id }
    })
  }

  if (next !== null && typeof next === 'object') {
    const previous = (saved !== null && typeof saved === 'object' ? saved : {}) as Record<
      string,
      unknown
    >
    return Object.fromEntries(
      Object.entries(next as Record<string, unknown>).map(([key, value]) => [
        key,
        withArrayRowIDs(value, previous[key]),
      ]),
    )
  }

  return next
}

export type ApplyStarterContentOptions = {
  /**
   * Whether to write the sample programme. Turn it off when the activities
   * come from somewhere else - a Google Calendar sync, say - so that a seeded
   * database never shows fixtures to real visitors.
   */
  activities?: boolean
}

/**
 * Writes the generated starter content into a database.
 *
 * Pages are created as empty drafts first so that internal links between them
 * can be resolved in a second pass, no matter how the pages reference each
 * other. The sample activities follow, so that a fresh database has something
 * for the agenda and the calendar to show, unless the caller sources its
 * activities elsewhere and asks for them to be left out.
 */
export async function applyStarterContent(
  payload: Payload,
  req?: PayloadRequest,
  options: ApplyStarterContentOptions = {},
) {
  const media = await ensureStarterMedia(payload, req)
  const pages = seedPages()
  const pageIDs: StarterPageIDs = {}

  for (const page of pages) {
    const existingID = await findPageID(payload, page, req)
    const id =
      existingID ??
      (
        await payload.create({
          collection: 'pages',
          draft: true,
          locale: 'nl',
          overrideAccess: true,
          req,
          data: {
            layout: [],
            slug: page.locales.nl.slug,
            title: page.locales.nl.title,
            _status: 'draft',
          },
        })
      ).id

    for (const locale of LOCALES) {
      const slug = page.locales[locale]?.slug
      if (slug) pageIDs[slug] = id
    }
  }

  for (const page of pages) {
    const id = pageIDs[page.locales.nl.slug]
    if (!id) continue

    for (const locale of LOCALES) {
      const content = page.locales[locale]
      if (!content) continue
      await payload.update({
        collection: 'pages',
        id,
        locale,
        overrideAccess: true,
        req,
        data: {
          layout: content.layout(media, pageIDs) as Page['layout'],
          navigationLabel: content.navigationLabel ?? null,
          sectionTitle: content.sectionTitle ?? null,
          seo: content.seo as Page['seo'],
          slug: content.slug,
          title: content.title,
          _status: 'published',
        },
      })
    }

    await payload.update({
      collection: 'pages',
      id,
      overrideAccess: true,
      req,
      data: {
        navigationOrder: page.navigationOrder ?? 0,
        parent: page.parentSlug ? (pageIDs[page.parentSlug] ?? null) : null,
      },
    })
  }

  /**
   * `navigation` and `footerLinks` are shared arrays carrying localized labels,
   * so both locales write to one set of rows. Payload only recognises a row it
   * is handed an `id` for; given none it replaces the array outright and the
   * locale written first silently loses its labels, leaving the site to fall
   * back to page titles and raw URLs. Passing the identifiers the first write
   * produced into the next locale keeps every locale on the same rows.
   */
  let savedSettings: SiteSetting | undefined
  for (const locale of LOCALES) {
    const data = starterSiteSettings[locale](media, pageIDs) as SiteSettingsInput
    savedSettings = await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      depth: 0,
      overrideAccess: true,
      req,
      data: savedSettings ? (withArrayRowIDs(data, savedSettings) as SiteSettingsInput) : data,
    })
  }

  const eventIDs = options.activities === false ? [] : await ensureSampleEvents(payload, media, req)

  return { eventIDs, media, pageIDs }
}
