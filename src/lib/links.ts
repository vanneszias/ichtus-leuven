import type { Locale } from '@/lib/content'
import type { Page } from '@/payload-types'

export type SiteLink = {
  label?: string | null
  type?: ('internal' | 'external') | null
  page?: number | Page | null
  url?: string | null
  newTab?: boolean | null
}

export function resolveLink(link: SiteLink | null | undefined, locale: Locale) {
  if (!link) return { href: '', label: '' }

  if (link.type === 'internal' && link.page && typeof link.page === 'object') {
    const slug = link.page.slug === 'home' ? '' : link.page.slug
    return { href: `/${locale}/${slug}`, label: link.label || link.page.title }
  }

  const url = link.url?.trim() || ''
  const href = url.startsWith('#') ? `/${locale}/${url}` : url
  return { href, label: link.label || url }
}
