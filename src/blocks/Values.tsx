import { Container, Section } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'

import { definePagePattern, theme } from './types'

export const valuesPattern = definePagePattern({
  schema: {
    slug: 'values',
    labels: { singular: 'Waardenbalk', plural: 'Waardenbalken' },
    fields: [
      {
        name: 'items',
        type: 'array',
        minRows: 2,
        maxRows: 6,
        required: true,
        fields: [{ name: 'label', type: 'text', required: true }],
      },
      appearanceFields('blue'),
    ],
  },
  fixture: {
    block: { blockType: 'values', items: [{ label: 'Geloof' }, { label: 'Vriendschap' }] },
    expectedText: 'Vriendschap',
  },
  render: ({ block }) => (
    <Section
      as="div"
      className="values"
      id={block.appearance?.anchor || undefined}
      spacing="compact"
      theme={theme(block, 'blue')}
    >
      <Container width={block.appearance?.width}>
        <ul className="values-list">
          {block.items?.map((item, index) => (
            <li key={item.id || index}>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  ),
})
