import { brusselsDateKey } from '@/lib/eventDisplay'
import { calendarEnd } from '@/lib/events'
import type { Event } from '@/payload-types'

/** Everything an iCalendar entry says about an activity. */
export type CalendarFileEvent = Pick<
  Event,
  'allDay' | 'endsAt' | 'id' | 'location' | 'source' | 'startsAt' | 'summary' | 'title'
>

const PRODUCT_ID = '-//Ichtus Leuven//Activiteiten//NL'

const MAX_OCTETS = 75

/** RFC 5545 reserves four characters inside a property value. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * A content line may not exceed 75 octets and is continued by a line starting
 * with a single space. The limit counts bytes rather than characters, so an
 * activity titled “Kringavond: café” has to fold over its UTF-8 encoding
 * without ever splitting a multi-byte sequence.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= MAX_OCTETS) return line

  const decoder = new TextDecoder()
  const parts: string[] = []
  let offset = 0
  while (offset < bytes.length) {
    // A continuation line spends one of its octets on the leading space.
    const limit = parts.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1
    let take = Math.min(limit, bytes.length - offset)
    // Continuation bytes of a UTF-8 sequence match 10xxxxxx; step back off one.
    while (take > 1 && offset + take < bytes.length && (bytes[offset + take] & 0xc0) === 0x80)
      take -= 1
    parts.push(decoder.decode(bytes.subarray(offset, offset + take)))
    offset += take
  }
  return parts.join('\r\n ')
}

/** `20260911T183000Z`, the only form every calendar client reads the same way. */
function utcStamp(value: Date): string {
  return `${value.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

/** `20260911`, the calendar day in Brussels rather than in UTC. */
function dateStamp(value: Date): string {
  return brusselsDateKey(value).replace(/-/g, '')
}

/**
 * One activity as a file a visitor can hand to any calendar application. A
 * single `VEVENT` rather than a subscription feed: the button answers “put
 * this evening in my agenda”, not “follow our programme”.
 *
 * An activity without an end time gets no `DTEND`. RFC 5545 reads that as an
 * event ending at the moment it starts, which is honest about what the site
 * knows; inventing a duration would put a wrong end time in someone's agenda.
 */
export function activityCalendarFile(
  event: CalendarFileEvent,
  { now, url }: { now: Date; url: string },
): string {
  const host = new URL(url).hostname
  const startsAt = new Date(event.startsAt)
  const endsAt = calendarEnd(event)
  const description = [event.summary?.trim(), url].filter(Boolean).join('\n\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // Stable per activity, so downloading the file twice updates the entry an
    // earlier download created instead of duplicating the evening.
    `UID:activiteit-${event.id}@${host}`,
    `DTSTAMP:${utcStamp(now)}`,
    event.allDay ? `DTSTART;VALUE=DATE:${dateStamp(startsAt)}` : `DTSTART:${utcStamp(startsAt)}`,
    ...(endsAt
      ? [
          event.allDay
            ? `DTEND;VALUE=DATE:${dateStamp(new Date(endsAt))}`
            : `DTEND:${utcStamp(new Date(endsAt))}`,
        ]
      : []),
    `SUMMARY:${escapeText(event.title)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    ...(event.location?.trim() ? [`LOCATION:${escapeText(event.location.trim())}`] : []),
    `URL:${escapeText(url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  // RFC 5545 lines end in CRLF, including the last one.
  return `${lines.map(fold).join('\r\n')}\r\n`
}
