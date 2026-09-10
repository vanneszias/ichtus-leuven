import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { CancellationForm } from '@/components/registrations/CancellationForm'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Container, Section } from '@/components/ui/Section'
import { getSiteSettings, type Locale, locales } from '@/lib/content'
import { formatEventDisplay } from '@/lib/eventDisplay'
import { hashToken } from '@/lib/registrationSecurity'

type Props = { params: Promise<{ locale: string; token: string }> }

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  alternates: {},
  openGraph: null,
  robots: { follow: false, index: false, noarchive: true },
  twitter: null,
}

export default async function CancellationPage({ params }: Props) {
  const route = await params
  if (!locales.includes(route.locale as Locale) || !/^[a-f0-9]{64}$/.test(route.token)) notFound()
  const locale = route.locale as Locale
  const payload = await getPayload({ config })
  const registrations = await payload.find({
    collection: 'registrations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { cancellationTokenHash: { equals: await hashToken(route.token) } },
        { status: { in: ['confirmed', 'waitlisted'] } },
      ],
    },
  })
  const registration = registrations.docs[0]
  if (
    !registration ||
    (registration.status !== 'confirmed' && registration.status !== 'waitlisted')
  )
    notFound()
  const eventID =
    typeof registration.event === 'object' ? registration.event.id : registration.event
  const [event, settings] = await Promise.all([
    payload.findByID({
      collection: 'events',
      id: eventID,
      locale,
      fallbackLocale: false,
      overrideAccess: true,
    }),
    getSiteSettings(locale),
  ])
  const date = formatEventDisplay(event, locale).detail
  const alternate = `/${locale === 'nl' ? 'en' : 'nl'}/registration/cancel/${route.token}`
  return (
    <>
      <SiteHeader
        alternateHref={alternate}
        currentPath={`/${locale}/registration/cancel/${route.token}`}
        locale={locale}
        settings={settings}
      />
      <main id="main-content" tabIndex={-1}>
        <Section spacing="spacious" theme="white">
          <Container className="simple-page" width="narrow">
            <h1>{locale === 'nl' ? 'Inschrijving annuleren?' : 'Cancel registration?'}</h1>
            <CancellationForm
              date={date}
              locale={locale}
              status={registration.status}
              title={event.title || (locale === 'nl' ? 'de activiteit' : 'the activity')}
              token={route.token}
            />
          </Container>
        </Section>
      </main>
      <SiteFooter locale={locale} settings={settings} />
    </>
  )
}
