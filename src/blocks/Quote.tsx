import { Container, Section } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'

import { definePagePattern, theme } from './types'

export const quotePattern = definePagePattern({
  schema: {
    slug: 'quote',
    labels: { singular: 'Quote', plural: 'Quotes' },
    fields: [
      { name: 'quote', type: 'textarea', required: true },
      { name: 'body', type: 'textarea' },
      { name: 'attribution', type: 'text' },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'quote',
      quote: 'Ik vond hier mensen die echt luisteren.',
      attribution: 'Een student',
    },
    expectedText: 'echt luisteren',
  },
  render: ({ block }) => (
    <Section
      as="div"
      className="quote-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'white')}
    >
      <Container className="quote-grid" width={block.appearance?.width}>
        <div>
          <blockquote>{block.quote}</blockquote>
          {block.attribution && <cite>{block.attribution}</cite>}
        </div>
        {block.body && <p className="lead">{block.body}</p>}
      </Container>
    </Section>
  ),
})
