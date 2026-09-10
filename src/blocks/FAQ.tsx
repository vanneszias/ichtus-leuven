import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'

import { definePagePattern, theme } from './types'

export const faqPattern = definePagePattern({
  schema: {
    slug: 'faq',
    labels: { singular: 'Veelgestelde vragen', plural: 'Veelgestelde vragen' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'textarea' },
      {
        name: 'items',
        type: 'array',
        minRows: 1,
        maxRows: 10,
        required: true,
        fields: [
          { name: 'question', type: 'text', required: true },
          { name: 'answer', type: 'textarea', required: true },
        ],
      },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'faq',
      heading: 'Veelgestelde vragen',
      items: [{ question: 'Moet ik christen zijn?', answer: 'Nee, je vragen zijn welkom.' }],
    },
    expectedText: 'je vragen zijn welkom',
  },
  render: ({ block }) => (
    <Section
      className="faq-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'white')}
    >
      <Container className="faq-layout" width={block.appearance?.width}>
        <SectionHeader heading={block.heading} intro={block.intro} />
        <div className="faq-list">
          {block.items.map((item, index) => (
            <details key={item.id || index} open={index === 0}>
              <summary>
                <span>{item.question}</span>
                <span aria-hidden="true" className="faq-toggle" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  ),
})
