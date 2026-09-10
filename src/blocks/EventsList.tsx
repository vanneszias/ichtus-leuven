import type { CSSProperties } from 'react'

import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'
import { formatBrusselsDateTime, formatEventDisplay } from '@/lib/eventDisplay'
import { eventDetailHref } from '@/lib/events'
import type { SiteLink } from '@/lib/links'
import { registrationAvailability } from '@/lib/registrations'
import type { Event } from '@/payload-types'

import { definePagePattern, theme } from './types'

const allDayLabels = { en: 'All day', nl: 'Hele dag' }

/**
 * The badge names the kind of evening in the club's own shorthand, so it stays
 * short enough to fill a circle at every size. The full label follows for
 * screen readers, which have no colour to read.
 */
const eventTypeBadges = {
  en: { largeGroup: 'GA', other: 'Extra', smallGroup: 'Group', wild: 'WILD' },
  nl: { largeGroup: 'GA', other: 'Extra', smallGroup: 'Kring', wild: 'WILD' },
}

const eventTypeClasses = {
  largeGroup: 'large-group',
  other: 'other',
  smallGroup: 'small-group',
  wild: 'wild',
}

const eventTypeLabels = {
  en: { largeGroup: 'Shared evening', other: 'Activity', smallGroup: 'Small group', wild: 'WILD' },
  nl: {
    largeGroup: 'Gezamenlijke avond',
    other: 'Activiteit',
    smallGroup: 'Kringavond',
    wild: 'WILD',
  },
}

export const eventsListPattern = definePagePattern({
  schema: {
    slug: 'eventsList',
    labels: { singular: 'Agenda', plural: 'Agenda’s' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'textarea' },
      { name: 'emptyMessage', type: 'text' },
      linkFields('emptyLink'),
      { name: 'limit', type: 'number', defaultValue: 4, min: 1, max: 12 },
      {
        name: 'selection',
        type: 'select',
        defaultValue: 'upcoming',
        options: [
          { label: 'Eerstvolgende activiteiten', value: 'upcoming' },
          { label: 'Handmatige selectie', value: 'manual' },
        ],
      },
      {
        name: 'events',
        type: 'relationship',
        relationTo: 'events',
        hasMany: true,
        admin: { condition: (_, siblingData) => siblingData?.selection === 'manual' },
      },
      linkFields('calendarLink'),
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'eventsList',
      heading: 'Binnenkort',
      selection: 'manual',
      events: [],
      emptyMessage: 'Nieuwe avonden volgen snel.',
    },
    expectedText: 'Nieuwe avonden volgen snel.',
  },
  render: async ({ block, locale }) => {
    let events: Event[] = []
    const limit = block.limit || 4
    if (block.selection === 'manual' && block.events) {
      events = block.events
        .filter((event): event is Event => typeof event === 'object')
        .slice(0, limit)
    } else {
      const { getUpcomingEvents } = await import('@/lib/content')
      events = await getUpcomingEvents(locale, limit)
    }

    const now = new Date()
    const capacityEvents = events.filter(
      (event) =>
        event.registrationMode === 'internal' &&
        Boolean(event.capacity) &&
        registrationAvailability(event, now) === 'open',
    )
    const confirmedByEvent = new Map<number, number>()
    if (capacityEvents.length) {
      const [{ default: config }, { getPayload }] = await Promise.all([
        import('@payload-config'),
        import('payload'),
      ])
      const payload = await getPayload({ config })
      const counts = await Promise.all(
        capacityEvents.map((event) =>
          payload.count({
            collection: 'registrations',
            overrideAccess: true,
            where: { and: [{ event: { equals: event.id } }, { status: { equals: 'confirmed' } }] },
          }),
        ),
      )
      capacityEvents.forEach((event, index) => {
        confirmedByEvent.set(event.id, counts[index].totalDocs)
      })
    }
    const emptyLink = (block as typeof block & { emptyLink?: SiteLink }).emptyLink

    return (
      <Section
        className="events-section"
        id={block.appearance?.anchor || undefined}
        spacing={block.appearance?.spacing}
        theme={theme(block, 'white')}
      >
        <Container width={block.appearance?.width}>
          <SectionHeader heading={block.heading} intro={block.intro} />
          <div className="event-list">
            {events.map((event) => {
              const display = formatEventDisplay(event, locale)
              const eventType = event.eventType || 'largeGroup'
              const badge = eventTypeBadges[locale][eventType]
              const availability = registrationAvailability(event, now)
              const isFull = Boolean(
                event.capacity && (confirmedByEvent.get(event.id) || 0) >= event.capacity,
              )
              const detail = eventDetailHref(event, locale)
              let actionLabel = locale === 'nl' ? 'Meer info' : 'More info'
              let actionUrl = event.registrationUrl || detail?.href
              let newTab = !detail || detail.external
              let status: string | null = null

              if (event.registrationMode === 'internal') {
                actionUrl = detail?.href
                newTab = false
                if (availability === 'notOpen') {
                  status = event.registrationOpensAt
                    ? locale === 'nl'
                      ? `Inschrijving opent ${formatBrusselsDateTime(event.registrationOpensAt, locale)}.`
                      : `Registration opens ${formatBrusselsDateTime(event.registrationOpensAt, locale)}.`
                    : locale === 'nl'
                      ? 'Inschrijving nog niet open.'
                      : 'Registration is not open yet.'
                  actionLabel = locale === 'nl' ? 'Bekijk details' : 'View details'
                } else if (availability === 'closed') {
                  status = locale === 'nl' ? 'Inschrijving gesloten.' : 'Registration closed.'
                  actionLabel = locale === 'nl' ? 'Bekijk details' : 'View details'
                } else if (isFull && event.waitlistEnabled) {
                  status =
                    locale === 'nl'
                      ? 'De activiteit is vol; de wachtlijst is open.'
                      : 'The activity is full; the waitlist is open.'
                  actionLabel = locale === 'nl' ? 'Naar de wachtlijst' : 'Join the waitlist'
                } else if (isFull) {
                  status = locale === 'nl' ? 'Deze activiteit is vol.' : 'This activity is full.'
                  actionLabel = locale === 'nl' ? 'Bekijk details' : 'View details'
                } else {
                  status = locale === 'nl' ? 'Er is plek.' : 'Places available.'
                  actionLabel = locale === 'nl' ? 'Schrijf je in' : 'Register'
                }
              }
              return (
                <article className="event-card" key={event.id}>
                  <p
                    className={`event-card__badge event-card__badge--${eventTypeClasses[eventType]}`}
                    style={{ '--badge-characters': badge.length } as CSSProperties}
                  >
                    <span aria-hidden="true">{badge}</span>
                    <span className="sr-only">{eventTypeLabels[locale][eventType]}</span>
                  </p>
                  <div className="event-card__body">
                    <h3>{event.title}</h3>
                    <p className="event-card__meta">
                      <time dateTime={event.startsAt}>
                        {[
                          display.cardDate,
                          display.cardTime ||
                            (event.allDay && !display.isMultiDay ? allDayLabels[locale] : null),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </time>
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                    {event.summary && <p className="event-card__summary">{event.summary}</p>}
                    {status && <p className="event-card__status">{status}</p>}
                  </div>
                  {actionUrl && (
                    <ButtonLink
                      link={{ label: actionLabel, type: 'external', url: actionUrl, newTab }}
                      locale={locale}
                      variant="secondary"
                    />
                  )}
                </article>
              )
            })}
            {events.length === 0 && (
              <div className="empty-state">
                <p>
                  {block.emptyMessage ||
                    (locale === 'nl'
                      ? 'Nieuwe activiteiten verschijnen hier binnenkort.'
                      : 'New activities will appear here soon.')}
                </p>
                <ButtonLink link={emptyLink} locale={locale} variant="secondary" />
              </div>
            )}
          </div>
          <ButtonLink link={block.calendarLink} locale={locale} variant="secondary" />
        </Container>
      </Section>
    )
  },
})
