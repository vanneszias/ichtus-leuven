import type { Locale } from '@/lib/content'
import type { Event } from '@/payload-types'

/** Where visitors read more about an Event, as chosen on the Event itself. */
export type EventDetail = NonNullable<Event['detail']>

export type EventHref = { external: boolean; href: string }

/**
 * Ichtus Vlaanderen runs its own activities and documents them on its own
 * site, so an activity of theirs sends visitors there rather than to a page
 * here that would only repeat the calendar entry.
 */
export const ICHTUS_VLAANDEREN_URL = 'https://ichtus.be/'

const MAX_SLUG_LENGTH = 60

/**
 * Derives a URL-safe slug from a localized Event title. Diacritics are folded
 * rather than dropped so “Kringavond café” stays readable as `kringavond-cafe`.
 */
export function eventSlugFromTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '')
}

/**
 * The public link for an Event, or null when the Event deliberately has none.
 * Calendar synchronization publishes recurring activities without editorial
 * follow-up, so “no page at all” has to stay a first-class outcome.
 */
export function eventDetailHref(
  event: Pick<Event, 'detail' | 'detailUrl' | 'eventType' | 'registrationMode' | 'slug'>,
  locale: Locale,
): EventHref | null {
  // Own page is the historical behavior, so an Event that predates the
  // setting keeps its page until an editor decides otherwise.
  const detail = event.detail ?? 'page'
  if (detail === 'external' && event.detailUrl?.trim())
    return { external: true, href: event.detailUrl.trim() }
  // An activity of Ichtus Vlaanderen points at their site instead of a page
  // here, unless this website is the one taking the registrations.
  if (
    detail === 'page' &&
    event.eventType === 'vlaanderen' &&
    event.registrationMode !== 'internal'
  )
    return { external: true, href: ICHTUS_VLAANDEREN_URL }
  if (detail === 'page' && event.slug?.trim())
    return { external: false, href: `/${locale}/activities/${event.slug.trim()}` }
  return null
}

/** The kind of evening an activity is, as chosen on the Event itself. */
export type EventType = NonNullable<Event['eventType']>

/** One activity as the interactive calendar consumes it. */
export type CalendarEntry = {
  allDay: boolean
  className?: string
  color: string
  contrastColor: string
  end?: string
  id: string
  start: string
  title: string
  url?: string
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * The colour is the type: a visitor learns to read a salmon circle as a WILD,
 * a pale blue one as a shared evening and a rose one as an activity of Ichtus
 * Vlaanderen. The two kinds the palette has no fill left for are told apart by
 * an outline and by inverting. `styles.css` paints the same five surfaces for
 * the agenda badge.
 */
type EventTypeSurface = Pick<CalendarEntry, 'className' | 'color' | 'contrastColor'>

const typeSurfaces: Record<EventType, EventTypeSurface> = {
  largeGroup: { color: 'var(--yellow)', contrastColor: 'var(--blue)' },
  other: { color: 'var(--blue)', contrastColor: 'var(--white)' },
  smallGroup: {
    className: 'fc-event--outlined',
    color: 'var(--white)',
    contrastColor: 'var(--blue)',
  },
  vlaanderen: { color: 'var(--rose)', contrastColor: 'var(--blue)' },
  wild: { color: 'var(--pink)', contrastColor: 'var(--blue)' },
}

export function eventTypeSurface(eventType: Event['eventType']) {
  return typeSurfaces[eventType || 'largeGroup']
}

/**
 * FullCalendar, like Google Calendar, reads the end of an all-day event as
 * exclusive. An editor enters the last day the activity runs, so a manually
 * maintained all-day activity gains a day on its way into the grid.
 */
function calendarEnd(event: Event): string | undefined {
  if (!event.endsAt) return undefined
  const end = new Date(event.endsAt)
  if (end < new Date(event.startsAt)) return undefined
  return event.allDay && event.source !== 'google'
    ? new Date(end.getTime() + DAY_IN_MS).toISOString()
    : end.toISOString()
}

export function calendarEntry(event: Event, locale: Locale): CalendarEntry {
  const surface = eventTypeSurface(event.eventType)
  return {
    allDay: Boolean(event.allDay),
    className: surface.className,
    color: surface.color,
    contrastColor: surface.contrastColor,
    end: calendarEnd(event),
    id: String(event.id),
    start: event.startsAt,
    title: event.title,
    url: eventDetailHref(event, locale)?.href,
  }
}
