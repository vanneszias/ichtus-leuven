import { describe, expect, it } from 'vitest'

import {
  shortLinkDestination,
  shortLinkDestinationLabel,
  shortLinkIsOpen,
  validateShortLinkCode,
} from '../../src/lib/shortLinks'
import type { Event, Page, ShortLink } from '../../src/payload-types'

const baseLink: ShortLink = {
  active: true,
  code: 'weekend',
  createdAt: '2026-09-11T10:00:00.000Z',
  destination: { type: 'url', url: 'https://forms.gle/x2KdP9qLm3' },
  id: 1,
  title: 'Weekendinschrijving',
  updatedAt: '2026-09-11T10:00:00.000Z',
}

const page = { id: 7, slug: 'about', title: 'Over ons' } as Page

const event = {
  detail: 'page',
  id: 42,
  slug: 'startavond',
  title: 'Startavond',
} as Event

describe('short link codes', () => {
  it('accepts lowercase codes with inner hyphens', () => {
    expect(validateShortLinkCode('weekend')).toBe(true)
    expect(validateShortLinkCode('kamp-2027')).toBe(true)
    expect(validateShortLinkCode('a')).toBe(true)
  })

  it('rejects codes that could not be typed back off a poster', () => {
    expect(validateShortLinkCode('Weekend Kamp')).toBeTypeOf('string')
    expect(validateShortLinkCode('-weekend')).toBeTypeOf('string')
    expect(validateShortLinkCode('weekend-')).toBeTypeOf('string')
    expect(validateShortLinkCode('')).toBeTypeOf('string')
    expect(validateShortLinkCode('a'.repeat(41))).toBeTypeOf('string')
  })

  it('refuses to shadow a path the site already answers', () => {
    expect(validateShortLinkCode('nl')).toBeTypeOf('string')
    expect(validateShortLinkCode('admin')).toBeTypeOf('string')
    expect(validateShortLinkCode('api')).toBeTypeOf('string')
  })
})

describe('short link availability', () => {
  const now = new Date('2026-09-11T12:00:00.000Z')

  it('stays open without an expiry', () => {
    expect(shortLinkIsOpen(baseLink, now)).toBe(true)
  })

  it('closes once deactivated or expired', () => {
    expect(shortLinkIsOpen({ ...baseLink, active: false }, now)).toBe(false)
    expect(shortLinkIsOpen({ ...baseLink, expiresAt: '2026-09-11T11:59:00.000Z' }, now)).toBe(false)
    expect(shortLinkIsOpen({ ...baseLink, expiresAt: '2026-09-11T12:01:00.000Z' }, now)).toBe(true)
  })
})

describe('short link destinations', () => {
  it('forwards an external URL untouched', () => {
    expect(shortLinkDestination(baseLink, 'nl')).toBe('https://forms.gle/x2KdP9qLm3')
  })

  it('resolves a page and an activity in the visitor’s locale', () => {
    const toPage: ShortLink = { ...baseLink, destination: { type: 'page', page } }
    expect(shortLinkDestination(toPage, 'en')).toBe('/en/about')

    const toHome: ShortLink = {
      ...baseLink,
      destination: { type: 'page', page: { ...page, slug: 'home' } },
    }
    expect(shortLinkDestination(toHome, 'nl')).toBe('/nl/')

    const toActivity: ShortLink = { ...baseLink, destination: { type: 'activity', event } }
    expect(shortLinkDestination(toActivity, 'nl')).toBe('/nl/activities/startavond')
  })

  it('resolves to nothing when the destination no longer exists', () => {
    expect(shortLinkDestination({ ...baseLink, destination: { type: 'page' } }, 'nl')).toBeNull()
    expect(shortLinkDestination({ ...baseLink, destination: { type: 'url' } }, 'nl')).toBeNull()
    // A relationship that was never populated arrives as a bare identifier.
    expect(
      shortLinkDestination({ ...baseLink, destination: { type: 'page', page: 7 } }, 'nl'),
    ).toBeNull()
  })
})

describe('destination labels', () => {
  it('drops the scheme and the trailing slash', () => {
    expect(shortLinkDestinationLabel('https://ichtus.be/kamp/')).toBe('ichtus.be/kamp')
  })

  it('keeps the host visible when the tail is long', () => {
    const label = shortLinkDestinationLabel(`https://forms.gle/${'q'.repeat(120)}`)
    expect(label.startsWith('forms.gle/')).toBe(true)
    expect(label.length).toBe(70)
    expect(label.endsWith('…')).toBe(true)
  })
})
