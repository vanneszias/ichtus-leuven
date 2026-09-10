import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { SiteHeaderClient } from '@/components/SiteHeaderClient'
import { SmartLink } from '@/components/ui/SmartLink'
import type { Locale } from '@/lib/content'
import { resolveLink } from '@/lib/links'
import type { SiteSetting } from '@/payload-types'

export function SiteHeader({
  alternateHref,
  currentPath,
  locale,
  settings,
}: {
  alternateHref: string | null
  currentPath: string
  locale: Locale
  settings: SiteSetting
}) {
  const otherLocale = locale === 'nl' ? 'en' : 'nl'
  const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/'
  const navigation = (
    <>
      {settings.navigation?.map(({ id, link }) => {
        const resolved = resolveLink(link, locale)
        const targetPath = resolved.href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
        const current =
          resolved.href.startsWith('/') &&
          !resolved.href.includes('#') &&
          targetPath === normalizedCurrentPath
        return (
          <SmartLink current={current} key={id} link={link} locale={locale}>
            {resolved.label}
          </SmartLink>
        )
      })}
      {alternateHref && (
        <Link
          aria-label={
            otherLocale === 'en'
              ? `${settings.englishLabel || 'en'} – View in English`
              : `${settings.dutchLabel || 'nl'} – Bekijk in het Nederlands`
          }
          className="language"
          href={alternateHref}
        >
          {otherLocale === 'en' ? settings.englishLabel || 'en' : settings.dutchLabel || 'nl'}
        </Link>
      )}
    </>
  )

  return (
    <SiteHeaderClient
      closeLabel={locale === 'nl' ? 'Menu sluiten' : 'Close menu'}
      logo={<Logo locale={locale} settings={settings} />}
      navigation={navigation}
      navigationLabel={locale === 'nl' ? 'Hoofdnavigatie' : 'Main navigation'}
    />
  )
}
