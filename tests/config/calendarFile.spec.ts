import { describe, expect, it } from 'vitest'

import { activityCalendarFile, type CalendarFileEvent } from '../../src/lib/calendarFile'

const options = {
  now: new Date('2026-09-01T08:00:00.000Z'),
  url: 'https://ichtusleuven.be/nl/activities/startavond',
}

const baseEvent: CalendarFileEvent = {
  id: 42,
  startsAt: '2026-09-10T17:00:00.000Z',
  endsAt: '2026-09-10T20:00:00.000Z',
  title: 'Startavond',
}

function lines(file: string) {
  return file.split('\r\n')
}

/** Unfolds the continuation lines so a property can be asserted as one value. */
function property(file: string, name: string) {
  return file
    .replace(/\r\n /g, '')
    .split('\r\n')
    .find((line) => line.startsWith(name))
}

describe('activity calendar file', () => {
  it('writes a single published event with CRLF line endings', () => {
    const file = activityCalendarFile(baseEvent, options)
    expect(lines(file).slice(0, 6)).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ichtus Leuven//Activiteiten//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
    ])
    expect(file.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(file.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })

  it('stamps timed activities in UTC and keeps the entry stable across downloads', () => {
    const file = activityCalendarFile(baseEvent, options)
    expect(property(file, 'DTSTART')).toBe('DTSTART:20260910T170000Z')
    expect(property(file, 'DTEND')).toBe('DTEND:20260910T200000Z')
    expect(property(file, 'DTSTAMP')).toBe('DTSTAMP:20260901T080000Z')
    expect(property(file, 'UID')).toBe('UID:activiteit-42@ichtusleuven.be')
  })

  it('leaves out the end of an activity that has none rather than inventing one', () => {
    const file = activityCalendarFile({ ...baseEvent, endsAt: null }, options)
    expect(property(file, 'DTEND')).toBeUndefined()
  })

  it('writes all-day activities as Brussels dates with an exclusive end', () => {
    // Midnight to midnight Brussels time: the editor entered 10 to 11 September.
    const file = activityCalendarFile(
      {
        ...baseEvent,
        allDay: true,
        startsAt: '2026-09-09T22:00:00.000Z',
        endsAt: '2026-09-10T22:00:00.000Z',
      },
      options,
    )
    expect(property(file, 'DTSTART')).toBe('DTSTART;VALUE=DATE:20260910')
    expect(property(file, 'DTEND')).toBe('DTEND;VALUE=DATE:20260912')
  })

  it('takes the exclusive end a synchronized all-day activity already carries', () => {
    const file = activityCalendarFile(
      {
        ...baseEvent,
        allDay: true,
        source: 'google',
        startsAt: '2026-09-10T00:00:00.000Z',
        endsAt: '2026-09-12T00:00:00.000Z',
      },
      options,
    )
    expect(property(file, 'DTSTART')).toBe('DTSTART;VALUE=DATE:20260910')
    expect(property(file, 'DTEND')).toBe('DTEND;VALUE=DATE:20260912')
  })

  it('escapes the characters that would otherwise end a property value', () => {
    const file = activityCalendarFile(
      { ...baseEvent, location: 'Naamsestraat 22, Leuven', summary: 'Eten; daarna\nsamen zingen' },
      options,
    )
    expect(property(file, 'LOCATION')).toBe('LOCATION:Naamsestraat 22\\, Leuven')
    expect(property(file, 'DESCRIPTION')).toBe(
      `DESCRIPTION:Eten\\; daarna\\nsamen zingen\\n\\n${options.url}`,
    )
  })

  it('folds long lines at 75 octets without splitting a character', () => {
    const file = activityCalendarFile(
      { ...baseEvent, title: `Kringavond café ${'é'.repeat(80)}` },
      options,
    )
    for (const line of lines(file)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
    expect(property(file, 'SUMMARY')).toBe(`SUMMARY:Kringavond café ${'é'.repeat(80)}`)
  })
})
