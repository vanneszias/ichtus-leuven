import { describe, expect, it } from 'vitest'

import { formatBrusselsDateTime, formatEventDisplay } from '../../src/lib/eventDisplay'

describe('Europe/Brussels event display', () => {
  it('uses Brussels daylight-saving time independently of the runtime timezone', () => {
    expect(formatBrusselsDateTime('2026-09-10T19:00:00.000Z', 'nl')).toContain('21:00')
    expect(formatBrusselsDateTime('2026-12-10T19:00:00.000Z', 'en')).toContain('20:00')
  })

  it('makes an overnight timed event unambiguous', () => {
    const display = formatEventDisplay(
      {
        allDay: false,
        startsAt: '2026-09-10T20:00:00.000Z',
        endsAt: '2026-09-11T09:00:00.000Z',
        source: 'manual',
      },
      'en',
    )

    expect(display.isMultiDay).toBe(true)
    expect(display.cardDate).toMatch(/10.*11.*Sep/)
    expect(display.cardTime).toBe('22:00–11:00')
    expect(display.detail).toMatch(/Thursday.*10 September 2026.*22:00/)
    expect(display.detail).toMatch(/Friday.*11 September 2026.*11:00/)
  })

  it('treats the Google all-day end date as exclusive', () => {
    const display = formatEventDisplay(
      {
        allDay: true,
        startsAt: '2026-09-10T00:00:00.000Z',
        endsAt: '2026-09-13T00:00:00.000Z',
        source: 'google',
      },
      'nl',
    )

    expect(display.cardTime).toBeNull()
    expect(display.cardDate).toMatch(/10.*12.*sep/)
    expect(display.cardDate).not.toMatch(/13.*sep/)
  })
})
