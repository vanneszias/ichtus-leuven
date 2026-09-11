import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageView } from '@/components/PageView'
import { ShortLinkView } from '@/components/ShortLinkView'
import { getAlternatePageHref, getPage, getSiteSettings, type Locale, locales } from '@/lib/content'
import { siteURL } from '@/lib/runtimeConfig'
import {
  createAlternates,
  createSocialMetadata,
  localizedPath,
  metadataRobots,
  resolveSocialImage,
} from '@/lib/seo'

type Props = { params: Promise<{ locale: string; slug?: string[] }> }

function parseParams(params: { locale: string; slug?: string[] }) {
  if (!locales.includes(params.locale as Locale)) notFound()
  return { locale: params.locale as Locale, slug: params.slug?.join('/') || 'home' }
}

/**
 * Short links live at the domain root, so `/weekend` arrives here with the
 * code where a locale prefix is expected. `/nl/weekend` reaches the same code
 * once no Page claims that slug, which is what gives an English visitor an
 * English confirmation screen.
 */
function shortLinkCode(params: { locale: string; slug?: string[] }) {
  const segments = locales.includes(params.locale as Locale)
    ? (params.slug ?? [])
    : [params.locale, ...(params.slug ?? [])]
  return segments.length === 1 ? segments[0] : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params
  // A confirmation screen is a waypoint, never a destination a crawler should
  // index in place of the page it forwards to.
  if (!locales.includes(resolved.locale as Locale)) return { robots: metadataRobots(true) }
  const route = parseParams(resolved)
  const [page, settings] = await Promise.all([
    getPage(route.locale, route.slug),
    getSiteSettings(route.locale),
  ])
  // Either a genuine 404 or a short link's confirmation screen; neither belongs
  // in an index.
  if (!page) return { robots: metadataRobots(true) }
  const otherLocale = route.locale === 'nl' ? 'en' : 'nl'
  const alternateHref = await getAlternatePageHref(page.id, otherLocale)
  const title = page.seo?.title || page.title
  const description = page.seo?.description || settings.defaultDescription || undefined
  const selectedImage = page.seo?.image || settings.defaultImage
  const currentHref = localizedPath(route.locale, route.slug)
  const siteTitle = title === settings.siteName ? title : `${title} | ${settings.siteName}`
  const localizedHrefs = { [route.locale]: currentHref } as Partial<Record<Locale, string>>
  if (alternateHref) localizedHrefs[otherLocale] = alternateHref
  const image = resolveSocialImage(
    selectedImage,
    settings.defaultImage,
    settings.siteName,
    siteURL(),
  )

  return {
    ...createSocialMetadata({
      alternateLocale: alternateHref ? otherLocale : undefined,
      description,
      image,
      locale: route.locale,
      siteName: settings.siteName,
      title: siteTitle,
      url: currentHref,
    }),
    title: siteTitle,
    description,
    alternates: createAlternates(currentHref, localizedHrefs),
    robots: metadataRobots(Boolean(page.seo?.noIndex)),
  }
}

export default async function ContentPage({ params }: Props) {
  const resolved = await params
  const code = shortLinkCode(resolved)
  if (!locales.includes(resolved.locale as Locale)) {
    if (!code) notFound()
    return <ShortLinkView code={code} locale="nl" />
  }

  const route = parseParams(resolved)
  if (code && !(await getPage(route.locale, route.slug)))
    return <ShortLinkView code={code} locale={route.locale} />
  return <PageView locale={route.locale} slug={route.slug} />
}
