import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageView } from '@/components/PageView'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = parseParams(await params)
  const [page, settings] = await Promise.all([
    getPage(route.locale, route.slug),
    getSiteSettings(route.locale),
  ])
  if (!page) return {}
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
  const route = parseParams(await params)
  return <PageView locale={route.locale} slug={route.slug} />
}
