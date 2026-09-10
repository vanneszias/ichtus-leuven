import type { Locale } from '@/lib/content'
import type { Event } from '@/payload-types'

export const EVENT_TIME_ZONE = 'Europe/Brussels'

const DAY_IN_MS = 24 * 60 * 60 * 1000

function language(locale: Locale) {
  return locale === 'nl' ? 'nl-BE' : 'en-BE'
}

function validEnd(event: Pick<Event, 'endsAt' | 'startsAt'>) {
  if (!event.endsAt) return null
  const startsAt = new Date(event.startsAt)
  const endsAt = new Date(event.endsAt)
  return endsAt >= startsAt ? endsAt : null
}

function visibleAllDayEnd(event: Pick<Event, 'allDay' | 'endsAt' | 'source' | 'startsAt'>) {
  const endsAt = validEnd(event)
  if (!endsAt) return null

  // Google Calendar follows RFC 5545 and supplies an exclusive end date for all-day events.
  return event.allDay && event.source === 'google' ? new Date(endsAt.getTime() - DAY_IN_MS) : endsAt
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
  }).format(date)
}

export function formatBrusselsDateTime(value: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(language(locale), {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(value))
}

export function formatEventDisplay(
  event: Pick<Event, 'allDay' | 'endsAt' | 'source' | 'startsAt'>,
  locale: Locale,
) {
  const startsAt = new Date(event.startsAt)
  const endsAt = event.allDay ? visibleAllDayEnd(event) : validEnd(event)
  const date = new Intl.DateTimeFormat(language(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
  })
  const fullDate = new Intl.DateTimeFormat(language(locale), {
    dateStyle: 'full',
    timeZone: EVENT_TIME_ZONE,
  })
  const dateTime = new Intl.DateTimeFormat(language(locale), {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: EVENT_TIME_ZONE,
  })
  const time = new Intl.DateTimeFormat(language(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  })
  const isMultiDay = Boolean(endsAt && localDateKey(startsAt) !== localDateKey(endsAt))

  return {
    cardDate: endsAt && isMultiDay ? date.formatRange(startsAt, endsAt) : date.format(startsAt),
    cardTime: event.allDay
      ? null
      : endsAt
        ? `${time.format(startsAt)}–${time.format(endsAt)}`
        : time.format(startsAt),
    detail: event.allDay
      ? endsAt && isMultiDay
        ? fullDate.formatRange(startsAt, endsAt)
        : fullDate.format(startsAt)
      : endsAt
        ? dateTime.formatRange(startsAt, endsAt)
        : dateTime.format(startsAt),
    isMultiDay,
  }
}
