import { Buttons } from '@/components/blocks/shared'
import { Container, Section } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'

import { accentOptions } from './schemaFields'
import { definePagePattern, theme } from './types'

export const callToActionPattern = definePagePattern({
  schema: {
    slug: 'callToAction',
    labels: { singular: 'Call to action', plural: 'Calls to action' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      { name: 'body', type: 'textarea' },
      linkFields('primaryLink', true),
      linkFields('secondaryLink'),
      { name: 'accent', type: 'select', defaultValue: 'blue', options: accentOptions },
      appearanceFields('blue'),
    ],
  },
  fixture: {
    block: {
      blockType: 'callToAction',
      heading: 'Kom eens langs',
      primaryLink: {
        label: 'Bekijk de agenda',
        type: 'external',
        url: 'https://example.com/agenda',
      },
    },
    expectedText: 'Bekijk de agenda',
  },
  render: ({ block, locale }) => (
    <Section
      className="cta"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, block.accent || 'blue')}
    >
      <Container width={block.appearance?.width}>
        <h2>{block.heading}</h2>
        {block.body && <p className="lead">{block.body}</p>}
        <Buttons
          inverse
          locale={locale}
          primary={block.primaryLink}
          secondary={block.secondaryLink}
        />
      </Container>
    </Section>
  ),
})
