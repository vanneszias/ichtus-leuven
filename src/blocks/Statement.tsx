import { DisplayText } from '@/components/blocks/shared'
import { Container, Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'

import { accentOptions } from './schemaFields'
import { definePagePattern, theme } from './types'

export const statementPattern = definePagePattern({
  schema: {
    slug: 'statement',
    labels: { singular: 'Kleurstatement', plural: 'Kleurstatements' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      { name: 'highlight', type: 'text' },
      { name: 'body', type: 'textarea', required: true },
      linkFields('link'),
      { name: 'accent', type: 'select', defaultValue: 'pink', options: accentOptions },
      appearanceFields('pink'),
    ],
  },
  fixture: {
    block: {
      blockType: 'statement',
      heading: 'Geloof dat beweegt',
      body: 'Met ruimte voor twijfel en nieuwsgierigheid.',
      link: { label: 'Lees meer over ons', type: 'external', url: '/nl/over-ons', newTab: false },
    },
    expectedText: 'Lees meer over ons',
  },
  render: ({ block, locale }) => {
    const surface = theme(block, block.accent || 'pink')
    return (
      <Section
        className={`statement accent-text-${block.accent || 'pink'}`}
        id={block.appearance?.anchor || undefined}
        spacing={block.appearance?.spacing}
        theme={surface}
      >
        <Container className="statement__inner" width={block.appearance?.width}>
          <h2>
            <DisplayText highlight={block.highlight} text={block.heading} />
          </h2>
          <div className="statement__copy">
            <p className="lead">{block.body}</p>
            <ButtonLink
              link={block.link}
              locale={locale}
              variant={surface === 'blue' || surface === 'pink' ? 'inverse' : 'primary'}
            />
          </div>
        </Container>
      </Section>
    )
  },
})
