import { DisplayText } from '@/components/blocks/shared'
import { Container, Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'

import { accentOptions } from './schemaFields'
import { definePagePattern, theme } from './types'

export const posterPattern = definePagePattern({
  schema: {
    slug: 'poster',
    labels: { singular: 'Poster', plural: 'Posters' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      { name: 'highlight', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'accent', type: 'select', defaultValue: 'yellow', options: accentOptions },
      linkFields('link'),
      appearanceFields('blue'),
    ],
  },
  fixture: {
    block: { blockType: 'poster', heading: 'Kom zoals je bent', title: 'Donderdagavond' },
    expectedText: 'Donderdagavond',
  },
  render: ({ block, locale }) => (
    <Section
      className="poster-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'white')}
    >
      <Container width={block.appearance?.width}>
        <article className={`poster accent-text-${block.accent || 'yellow'}`}>
          <h2>
            <DisplayText highlight={block.highlight} text={block.heading} />
          </h2>
          {block.title && <p className="poster__title">{block.title}</p>}
          <ButtonLink link={block.link} locale={locale} variant="inverse" />
        </article>
      </Container>
    </Section>
  ),
})
