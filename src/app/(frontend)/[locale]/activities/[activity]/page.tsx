import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPayload } from 'payload'

import { ActivityLocation } from '@/components/activities/ActivityLocation'
import { AddToCalendarButton } from '@/components/activities/AddToCalendarButton'
import { RegistrationForm } from '@/components/registrations/RegistrationForm'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { RichContent } from '@/components/ui/RichContent'
import { Container, Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/SmartLink'
import {
  getEvent,
  getEventBySlug,
  getEventLocaleHrefs,
  getSiteSettings,
  type Locale,
  locales,
} from '@/lib/content'
import { formatBrusselsDateTime, formatEventDisplay } from '@/lib/eventDisplay'
import { eventDetailHref } from '@/lib/events'
import { registrationAvailability } from '@/lib/registrations'
import { siteURL, turnstileSiteKey } from '@/lib/runtimeConfig'
import {
  createAlternates,
  createEventStructuredData,
  createSocialMetadata,
  metadataRobots,
  resolveSocialImage,
  serializeJSONLD,
} from '@/lib/seo'

type Props = { params: Promise<{ activity: string; locale: string }> }

/**
 * Activities are addressed by their localized slug. Numeric identifiers stay
 * resolvable because they were the public URLs before slugs existed and are
 * already indexed; the page redirects them onto the canonical slug.
 */
function resolveEvent(locale: Locale, activity: string) {
  return /^\d+$/.test(activity) ? getEvent(locale, activity) : getEventBySlug(locale, activity)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = await params
  if (!locales.includes(route.locale as Locale)) return {}
  const locale = route.locale as Locale
  const event = await resolveEvent(locale, route.activity)
  if (!event) return {}
  const [localizedHrefs, settings] = await Promise.all([
    getEventLocaleHrefs(event.id),
    getSiteSettings(locale),
  ])
  const canonicalLocale = localizedHrefs[locale]
    ? locale
    : locales.find((l) => localizedHrefs[l]) || locale
  const canonicalHref = localizedHrefs[canonicalLocale] || `/${locale}/activities/${route.activity}`
  const otherLocale = locale === 'nl' ? 'en' : 'nl'
  const description = event.summary || settings.defaultDescription || undefined
  const title =
    event.title === settings.siteName ? event.title : `${event.title} | ${settings.siteName}`
  const image = resolveSocialImage(event.image, settings.defaultImage, settings.siteName, siteURL())

  return {
    ...createSocialMetadata({
      alternateLocale: localizedHrefs[otherLocale] ? otherLocale : undefined,
      description,
      image,
      locale: canonicalLocale,
      siteName: settings.siteName,
      title,
      url: canonicalHref,
    }),
    alternates: createAlternates(canonicalHref, localizedHrefs),
    description,
    robots: metadataRobots(),
    title,
  }
}

export default async function ActivityPage({ params }: Props) {
  const route = await params
  if (!locales.includes(route.locale as Locale)) notFound()
  const locale = route.locale as Locale
  const event = await resolveEvent(locale, route.activity)
  if (!event) notFound()
  const canonical = eventDetailHref(event, locale)
  if (!canonical || canonical.external) notFound()
  if (route.activity !== event.slug) permanentRedirect(canonical.href)
  const [localizedHrefs, settings] = await Promise.all([
    getEventLocaleHrefs(event.id),
    getSiteSettings(locale),
  ])
  const availability = registrationAvailability(event)
  let isFull = false
  if (availability === 'open' && event.registrationMode === 'internal' && event.capacity) {
    const payload = await getPayload({ config })
    const confirmed = await payload.count({
      collection: 'registrations',
      overrideAccess: true,
      where: { and: [{ event: { equals: event.id } }, { status: { equals: 'confirmed' } }] },
    })
    isFull = confirmed.totalDocs >= event.capacity
  }
  const date = formatEventDisplay(event, locale).detail
  const now = new Date()
  let unavailableMessage: string | null = null
  if (availability === 'notOpen' && event.registrationOpensAt) {
    const opens = formatBrusselsDateTime(event.registrationOpensAt, locale)
    unavailableMessage =
      locale === 'nl' ? `De inschrijvingen openen op ${opens}.` : `Registration opens on ${opens}.`
  } else if (availability === 'closed' && new Date(event.startsAt) < now) {
    unavailableMessage =
      locale === 'nl'
        ? `Deze activiteit is gestart op ${date}. Inschrijven is niet meer mogelijk.`
        : `This activity started on ${date}. Registration is no longer possible.`
  } else if (
    availability === 'closed' &&
    event.registrationDeadline &&
    new Date(event.registrationDeadline) < now
  ) {
    const deadline = formatBrusselsDateTime(event.registrationDeadline, locale)
    unavailableMessage =
      locale === 'nl'
        ? `De inschrijvingsdeadline was ${deadline}. De inschrijvingen zijn gesloten.`
        : `The registration deadline was ${deadline}. Registration is closed.`
  } else if (availability === 'closed') {
    unavailableMessage =
      event.registrationClosedMessage ||
      (locale === 'nl' ? 'De inschrijvingen zijn gesloten.' : 'Registration is closed.')
  }
  const otherLocale = locale === 'nl' ? 'en' : 'nl'
  const alternate = localizedHrefs[otherLocale] || null
  const canonicalLocale = localizedHrefs[locale] ? locale : otherLocale
  const canonicalHref = localizedHrefs[canonicalLocale] || canonical.href
  const structuredAvailability =
    event.registrationMode === 'external'
      ? event.registrationUrl && new Date(event.startsAt) > now
        ? 'open'
        : 'closed'
      : availability
  // Most activities simply have no registration — you turn up. Saying
  // "registration is closed" about one of those invents a door that was never
  // there, so the card only appears where an editor arranged a way in.
  const registrationOffered =
    event.registrationMode === 'internal' || event.registrationMode === 'external'
  const socialImage = resolveSocialImage(
    event.image,
    settings.defaultImage,
    settings.siteName,
    siteURL(),
  )
  const structuredData = createEventStructuredData({
    availability: structuredAvailability,
    baseURL: siteURL(),
    description: event.summary || settings.defaultDescription || undefined,
    event,
    image: socialImage,
    isFull,
    locale: canonicalLocale,
    url: canonicalHref,
  })

  return (
    <div className="activity-page">
      {/* JSON-LD has to be injected as raw text: React escapes text children
        of <script>, which would corrupt the payload. serializeJSONLD escapes
        `<` as \u003c so the value cannot close the tag or inject markup. */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: escaped JSON-LD, see above
        dangerouslySetInnerHTML={{ __html: serializeJSONLD(structuredData) }}
        id="event-structured-data"
        type="application/ld+json"
      />
      <SiteHeader
        alternateHref={alternate}
        currentPath={canonical.href}
        locale={locale}
        settings={settings}
      />
      <main id="main-content" tabIndex={-1}>
        <Section className="activity-detail" spacing="spacious" theme="yellow">
          <Container
            className={`activity-detail__grid${registrationOffered ? '' : ' activity-detail__grid--single'}`}
          >
            <div>
              <h1>{event.title}</h1>
              <p className="activity-meta">
                <strong>{date}</strong>
              </p>
              {event.summary && <p className="lead">{event.summary}</p>}
              <AddToCalendarButton href={`${canonical.href}/calendar.ics`} locale={locale} />
              {event.body && (
                <div className="prose activity-body">
                  <RichContent data={event.body} locale={locale} />
                </div>
              )}
              {event.location && <ActivityLocation locale={locale} location={event.location} />}
            </div>
            {registrationOffered && (
              // <fieldset> is Biome's suggestion for role="group", but this card
              // holds a heading, prose and a form component rather than a set of
              // form controls with a legend, so the explicit role stays.
              // biome-ignore lint/a11y/useSemanticElements: not a fieldset, see above
              <div
                aria-label={locale === 'nl' ? 'Inschrijven' : 'Registration'}
                className="signup-card"
                role="group"
              >
                {structuredAvailability !== 'open' ? (
                  <p>{unavailableMessage}</p>
                ) : event.registrationMode === 'external' ? (
                  <>
                    <h2>{locale === 'nl' ? 'Schrijf je in.' : 'Sign up.'}</h2>
                    <p>
                      {locale === 'nl'
                        ? 'De inschrijvingen voor deze activiteit lopen via een andere pagina.'
                        : 'Registration for this activity is handled on another page.'}
                    </p>
                    <ButtonLink
                      link={{
                        label: locale === 'nl' ? 'Inschrijven' : 'Register',
                        newTab: true,
                        type: 'external',
                        url: event.registrationUrl,
                      }}
                      locale={locale}
                    />
                  </>
                ) : isFull && !event.waitlistEnabled ? (
                  <p>{locale === 'nl' ? 'Deze activiteit is vol.' : 'This activity is full.'}</p>
                ) : (
                  <>
                    <h2>
                      {isFull
                        ? locale === 'nl'
                          ? 'Wachtlijst'
                          : 'Waitlist'
                        : locale === 'nl'
                          ? 'Er is plek.'
                          : 'There is room.'}
                    </h2>
                    {isFull && (
                      <p>
                        {locale === 'nl'
                          ? 'Schrijf je in en we mailen je zodra er een plaats vrijkomt.'
                          : 'Join the waitlist and we will email you as soon as a place opens up.'}
                      </p>
                    )}
                    <RegistrationForm
                      eventID={event.id}
                      locale={locale}
                      turnstileSiteKey={turnstileSiteKey()}
                    />
                  </>
                )}
              </div>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter locale={locale} settings={settings} />
    </div>
  )
}
