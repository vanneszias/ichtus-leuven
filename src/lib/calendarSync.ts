import type { Payload } from 'payload'

import { ICHTUS_VLAANDEREN_URL } from '@/lib/events'
import { calendarConfig } from '@/lib/runtimeConfig'

type GoogleEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  htmlLink?: string
  location?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
}

type GoogleEventsResponse = {
  items?: GoogleEvent[]
  nextPageToken?: string
  nextSyncToken?: string
}

type CalendarSyncState = {
  page_token: string | null
  sync_token: string | null
  time_min: string | null
}

const PAGE_SIZE = 50

function d1(payload: Payload) {
  return payload.db.drizzle.$client as unknown as D1Database
}

/** The kind of evening a synced title announces, which also gives it its colour. */
function eventType(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes('vlaanderen')) return 'vlaanderen' as const
  if (normalized.includes('kring')) return 'smallGroup' as const
  if (normalized.includes('wild')) return 'wild' as const
  return 'largeGroup' as const
}

/**
 * Ichtus Vlaanderen announces its activities on its own site and carries that
 * page as the description of its calendar entry, so a synced activity of
 * theirs forwards there. Without a link in the description their front page is
 * the closest destination we know of.
 */
function vlaanderenLink(description: string | undefined) {
  return description?.match(/https:\/\/[^\s"'<>]+/)?.[0] ?? ICHTUS_VLAANDEREN_URL
}

function plainText(value: string | undefined) {
  return value
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

async function state(payload: Payload) {
  return d1(payload)
    .prepare(
      "SELECT page_token, sync_token, time_min FROM calendar_sync_state WHERE source = 'google'",
    )
    .first<CalendarSyncState>()
}

async function saveState(
  payload: Payload,
  pageToken?: string,
  syncToken?: string,
  timeMin?: string,
) {
  const now = new Date().toISOString()
  await d1(payload)
    .prepare(
      `
    INSERT INTO calendar_sync_state (source, page_token, sync_token, time_min, updated_at)
    VALUES ('google', ?, ?, ?, ?)
    ON CONFLICT(source) DO UPDATE SET page_token = excluded.page_token,
      sync_token = excluded.sync_token, time_min = excluded.time_min, updated_at = excluded.updated_at
  `,
    )
    .bind(pageToken ?? null, syncToken ?? null, timeMin ?? null, now)
    .run()
}

/**
 * The public site reads one locale without falling back, so an activity that
 * exists in Dutch alone is absent from the English agenda, calendar and
 * sitemap rather than merely untranslated. Google Calendar carries a single
 * Dutch title, so a synchronized activity seeds the English locale with it:
 * the activity is there to be found, and an editor replaces the wording with
 * real English copy. The address is shared so the English detail page answers
 * at the same slug the Dutch one does.
 */
async function seedEnglish(
  payload: Payload,
  id: number | string,
  data: { location?: string | null; slug?: string | null; summary?: string | null; title: string },
) {
  await payload.update({
    collection: 'events',
    id,
    data,
    locale: 'en',
    overrideAccess: true,
  })
}

export async function synchronizeCalendarSource(payload: Payload, fetcher: typeof fetch = fetch) {
  const { apiKey, calendarID } = calendarConfig()
  const current = await state(payload)
  const search = new URLSearchParams({
    key: apiKey,
    maxResults: String(PAGE_SIZE),
    showDeleted: 'true',
    singleEvents: 'true',
  })

  const initialTimeMin =
    current?.time_min ||
    (!current?.sync_token ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : undefined)
  if (current?.sync_token) {
    search.set('syncToken', current.sync_token)
  } else if (initialTimeMin) {
    search.set('orderBy', 'startTime')
    search.set('timeMin', initialTimeMin)
  }
  if (current?.page_token) {
    search.set('pageToken', current.page_token)
  }

  const response = await fetcher(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarID)}/events?${search}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (response.status === 410 && current?.sync_token) {
    await saveState(payload)
    return { reset: true, hasMore: true, synced: 0, skipped: 0 }
  }
  if (!response.ok) throw new Error(`Google Calendar returned ${response.status}`)

  const data = (await response.json()) as GoogleEventsResponse
  let synced = 0
  let skipped = 0
  for (const item of data.items ?? []) {
    const existing = await payload.find({
      collection: 'events',
      limit: 1,
      overrideAccess: true,
      where: { externalId: { equals: item.id } },
    })
    const stored = existing.docs[0]

    if (item.status === 'cancelled') {
      if (!stored) {
        skipped += 1
        continue
      }
      await payload.update({
        collection: 'events',
        id: stored.id,
        context: { registrationClosureReason: 'upstreamCancelled' },
        data: { _status: 'draft', lastSyncedAt: new Date().toISOString() },
        locale: 'nl',
        overrideAccess: true,
      })
      synced += 1
      continue
    }

    const startsAt = item.start?.dateTime || item.start?.date
    if (!startsAt || !item.summary) {
      skipped += 1
      continue
    }
    const sourceData = {
      title: item.summary,
      startsAt: new Date(startsAt).toISOString(),
      endsAt:
        item.end?.dateTime || item.end?.date
          ? new Date(item.end.dateTime || item.end.date).toISOString()
          : undefined,
      allDay: Boolean(item.start?.date && !item.start.dateTime),
      location: item.location,
      externalId: item.id,
      externalUrl: item.htmlLink,
      source: 'google' as const,
      lastSyncedAt: new Date().toISOString(),
    }
    if (stored) {
      await payload.update({
        collection: 'events',
        id: stored.id,
        data: sourceData,
        locale: 'nl',
        overrideAccess: true,
      })
      const english = await payload.findByID({
        collection: 'events',
        id: stored.id,
        fallbackLocale: false,
        locale: 'en',
        overrideAccess: true,
      })
      // An English title of an editor's own outranks the calendar; a copy that
      // still repeats the Dutch one was never translated and keeps following
      // the source. The summary is left out here for the same reason the Dutch
      // copy leaves it out: editors write it, the description does not.
      if (!english.title?.trim() || english.title === stored.title)
        await seedEnglish(payload, stored.id, {
          location: sourceData.location,
          slug: english.slug?.trim() ? undefined : stored.slug,
          title: sourceData.title,
        })
    } else {
      const type = eventType(item.summary)
      const forward = type === 'vlaanderen' ? vlaanderenLink(item.description) : null
      const summary = plainText(item.description)
      const created = await payload.create({
        collection: 'events',
        locale: 'nl',
        overrideAccess: true,
        data: {
          ...sourceData,
          ...(forward ? { detail: 'external' as const, detailUrl: forward } : {}),
          eventType: type,
          // The description of a forwarded activity is that very link, which
          // the agenda would otherwise repeat as the activity's summary.
          summary: summary === forward ? undefined : summary,
          _status: 'published',
        },
      })
      await seedEnglish(payload, created.id, {
        location: created.location,
        slug: created.slug,
        summary: created.summary,
        title: created.title,
      })
    }
    synced += 1
  }

  await saveState(
    payload,
    data.nextPageToken,
    data.nextSyncToken ?? current?.sync_token ?? undefined,
    data.nextPageToken && !current?.sync_token ? initialTimeMin : undefined,
  )
  return { hasMore: Boolean(data.nextPageToken), reset: false, skipped, synced }
}
