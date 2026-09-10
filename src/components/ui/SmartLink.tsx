import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Locale } from '@/lib/content'
import { resolveLink, type SiteLink } from '@/lib/links'

type Props = {
  children?: ReactNode
  className?: string
  current?: boolean
  link?: SiteLink | null
  locale: Locale
}

export function NewWindowAnnouncement({ locale }: { locale: Locale }) {
  return (
    <span className="sr-only">
      {locale === 'nl' ? ' (opent in een nieuw venster)' : ' (opens in a new window)'}
    </span>
  )
}

export function SmartLink({ children, className, current, link, locale }: Props) {
  const resolved = resolveLink(link, locale)
  if (!resolved.href || (!children && !resolved.label)) return null

  const content = children || resolved.label
  const external = /^(?:https?:|mailto:|tel:)/.test(resolved.href)
  const props = {
    'aria-current': current ? ('page' as const) : undefined,
    className,
    rel: link?.newTab ? 'noopener noreferrer' : undefined,
    target: link?.newTab ? '_blank' : undefined,
  }

  return external ? (
    <a href={resolved.href} {...props}>
      {content}
      {link?.newTab && <NewWindowAnnouncement locale={locale} />}
    </a>
  ) : (
    <Link href={resolved.href} {...props}>
      {content}
      {link?.newTab && <NewWindowAnnouncement locale={locale} />}
    </Link>
  )
}

export function ButtonLink({
  link,
  locale,
  variant = 'primary',
}: Props & { variant?: 'primary' | 'secondary' | 'inverse' }) {
  const resolved = resolveLink(link, locale)
  const icon = resolved.href.startsWith('mailto:')
    ? 'email'
    : resolved.href.includes('instagram.com')
      ? 'instagram'
      : null

  return (
    <SmartLink
      className={`button button--${variant}${icon ? ` button--icon button--icon-${icon}` : ''}`}
      link={link}
      locale={locale}
    >
      <span>{resolved.label}</span>
      {icon === 'email' && (
        <svg aria-hidden="true" className="button__icon" viewBox="0 0 24 24">
          <rect height="15" rx="2" width="20" x="2" y="4.5" />
          <path className="button__icon-detail" d="m3 6.5 9 7 9-7" />
        </svg>
      )}
      {icon === 'instagram' && (
        <svg aria-hidden="true" className="button__icon" viewBox="0 0 24 24">
          <rect height="18" rx="5" width="18" x="3" y="3" />
          <circle cx="12" cy="12" r="4" />
          <circle className="button__icon-dot" cx="17.4" cy="6.7" r="1" />
        </svg>
      )}
    </SmartLink>
  )
}
