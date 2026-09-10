import { describe, expect, it } from 'vitest'

import { sampleEvents, sampleEventTimes } from '../../src/seed/sampleEvents'

/** A Thursday, so the anchor has to fall back to the Wednesday before it. */
const reference = new Date('2026-09-10T09:00:00.000Z')

const bySlug = (slug: string) =>
  sampleEvents.find((sample) => sample.locales.nl.slug === slug) ??
  sampleEvents.find((sample) => sample.locales.nl.title === slug)

describe('sample activity schedule', () => {
  it('anchors the programme on the Wednesday of the seeded week', () => {
    const evening = bySlug('ga-bidden-als-een-beginner')
    if (!evening) throw new Error('sample missing')

    // 18:30 in Brussels, a week before Wednesday 9 September 2026.
    expect(sampleEventTimes(evening, reference).startsAt).toBe('2026-09-02T16:30:00Z')
    expect(sampleEventTimes(evening, reference).endsAt).toBe('2026-09-02T20:00:00Z')
  })

  it('leaves both past and upcoming activities on a fresh database', () => {
    const starts = sampleEvents.map((sample) => sampleEventTimes(sample, reference).startsAt)
    expect(starts.filter((start) => start < reference.toISOString()).length).toBeGreaterThan(0)
    expect(starts.filter((start) => start > reference.toISOString()).length).toBeGreaterThan(3)
  })

  it('ends a multi-day activity on the last day it runs', () => {
    const weekend = bySlug('ichtusweekend')
    if (!weekend) throw new Error('sample missing')
    const times = sampleEventTimes(weekend, reference)

    expect(weekend.allDay).toBe(true)
    // Friday 2 October through Sunday 4 October, read as Brussels midnights.
    expect(times.startsAt).toBe('2026-10-01T22:00:00Z')
    expect(times.endsAt).toBe('2026-10-03T22:00:00Z')
    expect(times.registrationDeadline).toBe('2026-09-22T21:59:00Z')
  })

  it('exercises every activity type and link mode', () => {
    const values = (pick: (sample: (typeof sampleEvents)[number]) => string | undefined) =>
      new Set(sampleEvents.map(pick))

    expect(values((sample) => sample.eventType)).toEqual(
      new Set(['largeGroup', 'smallGroup', 'wild', 'other']),
    )
    expect(values((sample) => sample.detail)).toEqual(new Set(['page', 'external', 'none']))
    expect(values((sample) => sample.registrationMode)).toEqual(
      new Set([undefined, 'internal', 'external']),
    )
  })

  it('gives every own-page activity a slug in both locales', () => {
    for (const sample of sampleEvents) {
      if (sample.detail !== 'page') continue
      expect(sample.locales.nl.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(sample.locales.en.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(sample.locales.en.slug).not.toBe(sample.locales.nl.slug)
    }
  })
})
