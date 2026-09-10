import config from '@payload-config'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { PageView } from '@/components/PageView'
import { type Locale, locales } from '@/lib/content'

type Props = { params: Promise<{ locale: string; slug?: string[] }> }

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  alternates: {},
  openGraph: null,
  robots: { follow: false, index: false, noarchive: true },
  twitter: null,
}

export default async function PreviewPage({ params }: Props) {
  const route = await params
  if (!locales.includes(route.locale as Locale)) notFound()
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user) notFound()
  return <PageView draft locale={route.locale as Locale} slug={route.slug?.join('/') || 'home'} />
}
