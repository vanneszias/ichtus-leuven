import { describe, expect, it } from 'vitest'

import { calendarEntry, eventDetailHref, eventSlugFromTitle } from '../../src/lib/events'
import type { Event } from '../../src/payload-types'

const baseEvent: Event = {
  createdAt: '2026-08-30T10:00:00.000Z',
  detail: 'page',
  id: 42,
  slug: 'startavond',
  startsAt: '2026-09-10T19:00:00.000Z',
  title: 'Startavond',
  updatedAt: '2026-08-30T10:00:00.000Z',
}

describe('activity slugs', () => {
  it('folds diacritics and punctuation into a readable slug', () => {
    expect(eventSlugFromTitle('Kringavond café — dé eerste!')).toBe('kringavond-cafe-de-eerste')
    expect(eventSlugFromTitle('WILD #3')).toBe('wild-3')
  })

  it('never ends on a separator, even after truncation', () => {
    const slug = eventSlugFromTitle(`${'a'.repeat(58)} tweede deel`)
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('yields nothing for a title without usable characters', () => {
    expect(eventSlugFromTitle('— · —')).toBe('')
  })
})

describe('activity links', () => {
  it('addresses an own page by its localized slug', () => {
    expect(eventDetailHref(baseEvent, 'nl')).toEqual({
      external: false,
      href: '/nl/activities/startavond',
    })
    expect(eventDetailHref({ ...baseEvent, slug: 'opening-night' }, 'en')?.href).toBe(
      '/en/activities/opening-night',
    )
  })

  it('sends visitors to the external page when that is the chosen destination', () => {
    expect(
      eventDetailHref(
        { ...baseEvent, detail: 'external', detailUrl: 'https://ifesworld.org/event' },
        'nl',
      ),
    ).toEqual({ external: true, href: 'https://ifesworld.org/event' })
  })

  it('has no link when the activity opted out or lacks a translation', () => {
    expect(eventDetailHref({ ...baseEvent, detail: 'none' }, 'nl')).toBeNull()
    expect(eventDetailHref({ ...baseEvent, slug: null }, 'nl')).toBeNull()
    expect(eventDetailHref({ ...baseEvent, detail: 'external', detailUrl: null }, 'nl')).toBeNull()
  })

  it('forwards an activity of Ichtus Vlaanderen to their own site', () => {
    expect(eventDetailHref({ ...baseEvent, eventType: 'vlaanderen' }, 'nl')).toEqual({
      external: true,
      href: 'https://ichtus.be/',
    })
    expect(
      eventDetailHref(
        {
          ...baseEvent,
          detail: 'external',
          detailUrl: 'https://ichtus.be/ichtus-apero/',
          eventType: 'vlaanderen',
        },
        'nl',
      )?.href,
    ).toBe('https://ichtus.be/ichtus-apero/')
  })

  it('keeps the own page of a Vlaanderen activity that registers on this website', () => {
    expect(
      eventDetailHref({ ...baseEvent, eventType: 'vlaanderen', registrationMode: 'internal' }, 'nl')
        ?.href,
    ).toBe('/nl/activities/startavond')
  })

  it('treats an Event from before the setting existed as having its own page', () => {
    expect(eventDetailHref({ ...baseEvent, detail: null }, 'nl')?.href).toBe(
      '/nl/activities/startavond',
    )
  })
})

describe('calendar entries', () => {
  it('colours an entry by its activity type and carries the detail link', () => {
    expect(calendarEntry({ ...baseEvent, eventType: 'wild' }, 'nl')).toEqual({
      allDay: false,
      className: undefined,
      color: 'var(--pink)',
      contrastColor: 'var(--blue)',
      end: undefined,
      id: '42',
      start: '2026-09-10T19:00:00.000Z',
      title: 'Startavond',
      url: '/nl/activities/startavond',
    })
  })

  it('keeps a white kringavond visible on a white grid, and inverts the rest', () => {
    const smallGroup = calendarEntry({ ...baseEvent, eventType: 'smallGroup' }, 'nl')
    const other = calendarEntry({ ...baseEvent, eventType: 'other' }, 'nl')

    expect(smallGroup.color).toBe('var(--white)')
    expect(smallGroup.className).toBe('fc-event--outlined')
    expect(other.color).toBe('var(--blue)')
    expect(other.contrastColor).toBe('var(--white)')
  })

  it('gives an activity of Ichtus Vlaanderen its own rose surface', () => {
    expect(calendarEntry({ ...baseEvent, eventType: 'vlaanderen' }, 'nl')).toMatchObject({
      color: 'var(--rose)',
      contrastColor: 'var(--blue)',
      url: 'https://ichtus.be/',
    })
  })

  it('falls back to the shared-evening colour for an activity without a type', () => {
    expect(calendarEntry(baseEvent, 'nl').color).toBe('var(--yellow)')
  })

  it('makes an editor-entered all-day end exclusive but leaves a synced one alone', () => {
    const manual = calendarEntry(
      { ...baseEvent, allDay: true, endsAt: '2026-09-12T19:00:00.000Z' },
      'nl',
    )
    const synced = calendarEntry(
      { ...baseEvent, allDay: true, endsAt: '2026-09-12T19:00:00.000Z', source: 'google' },
      'nl',
    )

    expect(manual.end).toBe('2026-09-13T19:00:00.000Z')
    expect(synced.end).toBe('2026-09-12T19:00:00.000Z')
  })

  it('drops an end that precedes the start', () => {
    expect(calendarEntry({ ...baseEvent, endsAt: '2026-09-09T19:00:00.000Z' }, 'nl').end).toBe(
      undefined,
    )
  })
})
