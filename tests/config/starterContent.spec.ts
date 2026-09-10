import { describe, expect, it } from 'vitest'

import { calendarStarterPage } from '../../src/seed/calendarPage'
import { baselinePages, type StarterPage, seedPages } from '../../src/seed/starterContent'

const slugs = (pages: StarterPage[]) => pages.map((page) => page.locales.nl.slug)

describe('starter content baseline pages', () => {
  it('adds the calendar page a content pull has not captured yet', () => {
    expect(baselinePages).toContain(calendarStarterPage)
    expect(slugs(seedPages([]))).toEqual(['kalender'])
    expect(seedPages([])[0].locales.en.slug).toBe('calendar')
  })

  it('steps aside once the generated snapshot holds the same page', () => {
    const pulled: StarterPage = {
      key: 'kalender',
      locales: {
        en: { layout: () => [], slug: 'calendar', title: 'Calendar' },
        nl: { layout: () => [], slug: 'kalender', title: 'Kalender' },
      },
    }

    expect(seedPages([pulled])).toEqual([pulled])
  })

  it('recognizes the generated page by either locale slug', () => {
    const dutchOnly: StarterPage = {
      key: 'kalender',
      locales: {
        en: { layout: () => [], slug: 'agenda', title: 'Agenda' },
        nl: { layout: () => [], slug: 'kalender', title: 'Kalender' },
      },
    }

    expect(seedPages([dutchOnly])).toEqual([dutchOnly])
  })

  it('keeps every generated page alongside the baseline', () => {
    const other: StarterPage = {
      key: 'home',
      locales: {
        en: { layout: () => [], slug: 'home', title: 'Home' },
        nl: { layout: () => [], slug: 'home', title: 'Home' },
      },
    }

    expect(slugs(seedPages([other]))).toEqual(['home', 'kalender'])
  })
})
