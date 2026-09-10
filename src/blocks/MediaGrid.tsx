import { ResponsiveMedia } from '@/components/blocks/shared'
import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'

import { definePagePattern, theme } from './types'

function imageSizes(columns: 'mixed' | 'three' | 'two' | null | undefined, index: number) {
  const mobile = '(max-width: 680px) calc(100vw - 28px)'
  if (columns === 'three') return `${mobile}, (max-width: 1264px) calc(33vw - 34px), 387px`
  if (columns === 'mixed' && (index + 1) % 3 === 0)
    return `${mobile}, (max-width: 1264px) calc(67vw - 43px), 793px`
  return `${mobile}, (max-width: 1264px) calc(50vw - 42px), 590px`
}

export const mediaGridPattern = definePagePattern({
  schema: {
    slug: 'mediaGrid',
    labels: { singular: 'Fotorooster', plural: 'Fotoroosters' },
    fields: [
      { name: 'heading', type: 'text' },
      {
        name: 'images',
        type: 'array',
        minRows: 2,
        maxRows: 8,
        required: true,
        fields: [
          { name: 'image', type: 'upload', relationTo: 'media', required: true },
          { name: 'caption', type: 'text' },
        ],
      },
      {
        name: 'columns',
        type: 'select',
        defaultValue: 'mixed',
        options: [
          { label: 'Twee kolommen', value: 'two' },
          { label: 'Drie kolommen', value: 'three' },
          { label: 'Speels gemengd', value: 'mixed' },
        ],
      },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'mediaGrid',
      heading: 'Samen in Leuven',
      images: [
        { image: 1, caption: 'Aan tafel' },
        { image: 2, caption: 'Op weekend' },
      ],
    },
    expectedText: 'Op weekend',
  },
  render: ({ block }) => (
    <Section
      className="media-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'white')}
    >
      <Container width={block.appearance?.width}>
        {block.heading && <SectionHeader heading={block.heading} />}
        <div className={`media-grid media-grid--${block.columns || 'mixed'}`}>
          {block.images?.map(({ id, image, caption }, index) => (
            <figure key={id || index}>
              <ResponsiveMedia media={image} sizes={imageSizes(block.columns, index)} />
              {caption && <figcaption>{caption}</figcaption>}
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  ),
})
