import { notFound } from 'next/navigation'

import { AboutNavigation } from '@/components/AboutNavigation'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import {
  getAlternatePageHref,
  getPage,
  getSectionNavigation,
  getSiteSettings,
  type Locale,
} from '@/lib/content'

export async function PageView({
  draft = false,
  locale,
  slug,
}: {
  draft?: boolean
  locale: Locale
  slug: string
}) {
  const [page, settings] = await Promise.all([
    getPage(locale, slug, draft),
    getSiteSettings(locale),
  ])
  if (!page) notFound()
  const otherLocale = locale === 'nl' ? 'en' : 'nl'
  const currentPath = `/${locale}/${slug}`
  const [publicAlternateHref, sectionNavigation] = await Promise.all([
    getAlternatePageHref(page.id, otherLocale, draft),
    getSectionNavigation(page, locale, draft),
  ])
  const alternateHref =
    draft && publicAlternateHref
      ? publicAlternateHref.replace(/^\/(nl|en)(?=\/|$)/, '/$1/preview')
      : publicAlternateHref

  return (
    <>
      <SiteHeader
        alternateHref={alternateHref}
        currentPath={currentPath}
        locale={locale}
        settings={settings}
      />
      <main id="main-content" tabIndex={-1}>
        {sectionNavigation && (
          <AboutNavigation currentPath={currentPath} navigation={sectionNavigation} />
        )}
        <BlockRenderer blocks={page.layout} locale={locale} pageTitle={page.title} />
      </main>
      <SiteFooter locale={locale} settings={settings} />
    </>
  )
}
