import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'
import { calendarEntry } from '@/lib/events'

import { definePagePattern, theme } from './types'

export const calendarPattern = definePagePattern({
  schema: {
    slug: 'calendar',
    labels: { singular: 'Kalender', plural: 'Kalenders' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'textarea' },
      { name: 'emptyMessage', type: 'text' },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'calendar',
      heading: 'Kalender',
      emptyMessage: 'Er staan nog geen activiteiten in de kalender.',
    },
    expectedText: 'Kalender',
  },
  render: async ({ block, locale }) => {
    // Imported on demand: the Payload config loads this module in plain Node,
    // where the calendar's stylesheet imports cannot be resolved.
    const [{ getCalendarEvents }, { EventCalendar }] = await Promise.all([
      import('@/lib/content'),
      import('@/components/blocks/EventCalendar'),
    ])
    const events = await getCalendarEvents(locale)
    const entries = events.map((event) => calendarEntry(event, locale))

    return (
      <Section
        className="calendar-section"
        id={block.appearance?.anchor || undefined}
        spacing={block.appearance?.spacing}
        theme={theme(block, 'white')}
      >
        <Container width={block.appearance?.width}>
          <SectionHeader heading={block.heading} intro={block.intro} />
          {entries.length ? (
            <EventCalendar entries={entries} locale={locale} />
          ) : (
            <div className="empty-state">
              <p>
                {block.emptyMessage ||
                  (locale === 'nl'
                    ? 'Er staan nog geen activiteiten in de kalender.'
                    : 'There are no activities in the calendar yet.')}
              </p>
            </div>
          )}
        </Container>
      </Section>
    )
  },
})
