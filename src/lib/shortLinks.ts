import type { Payload } from 'payload'

import type { Locale } from '@/lib/content'
import { eventDetailHref } from '@/lib/events'
import type { ShortLink } from '@/payload-types'

/**
 * Short codes sit directly under the domain root, so a code may never shadow a
 * path the site already answers. Static assets are safe without being listed:
 * every file under `public` carries an extension, which the code pattern
 * rejects. Only the directories and the routed prefixes need naming.
 */
export const reservedShortLinkCodes = ['admin', 'api', 'en', 'fonts', 'logos', 'nl', 'photos']

const CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export function validateShortLinkCode(value: unknown): true | string {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!CODE_PATTERN.test(code))
    return 'Gebruik 1 tot 40 tekens: kleine letters, cijfers en koppeltekens tussenin.'
  if (reservedShortLinkCodes.includes(code))
    return `“${code}” is een vast adres van de website en kan geen korte link zijn.`
  return true
}

/** Whether the code still sends visitors anywhere at all. */
export function shortLinkIsOpen(
  link: Pick<ShortLink, 'active' | 'expiresAt'>,
  now: Date = new Date(),
): boolean {
  if (link.active === false) return false
  return !link.expiresAt || new Date(link.expiresAt) > now
}

/**
 * Where the code sends a visitor, in their own locale, or null when the chosen
 * destination no longer resolves — a deleted page, or an activity whose editor
 * decided it has no page of its own.
 */
export function shortLinkDestination(link: ShortLink, locale: Locale): string | null {
  const destination = link.destination
  if (!destination) return null

  if (destination.type === 'page') {
    const page = destination.page
    if (!page || typeof page !== 'object' || !page.slug) return null
    return `/${locale}/${page.slug === 'home' ? '' : page.slug}`
  }

  if (destination.type === 'activity') {
    const event = destination.event
    if (!event || typeof event !== 'object') return null
    return eventDetailHref(event, locale)?.href || null
  }

  return destination.url?.trim() || null
}

/**
 * The destination as the confirmation screen shows it. A visitor decides on
 * the host far more than on the query string, so the origin stays intact and
 * only a long tail is trimmed.
 */
export function shortLinkDestinationLabel(destination: string, maxLength = 70): string {
  const label = destination.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label
}

export const SHORT_LINK_CLICK_RETENTION_MONTHS = 12

/**
 * Click rows are the exact record of a short link's traffic, but they grow
 * with every visitor, so they age out on the same twelve-month horizon as
 * registration data. Bounded per call, like the other maintenance work it runs
 * alongside.
 */
export async function pruneShortLinkClicks(payload: Payload, limit = 25) {
  const cutoff = new Date()
  cutoff.setUTCMonth(cutoff.getUTCMonth() - SHORT_LINK_CLICK_RETENTION_MONTHS)
  const stale = await payload.find({
    collection: 'short-link-clicks',
    limit,
    sort: 'createdAt',
    where: { createdAt: { less_than: cutoff.toISOString() } },
  })
  if (!stale.docs.length) return { deleted: 0, hasMore: false }
  await payload.delete({
    collection: 'short-link-clicks',
    where: { id: { in: stale.docs.map((doc) => doc.id) } },
  })
  return { deleted: stale.docs.length, hasMore: stale.docs.length === limit }
}
