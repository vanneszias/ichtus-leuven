import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { ButtonLink, SmartLink } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'

import { definePagePattern, theme } from './types'

export const infoCardsPattern = definePagePattern({
  schema: {
    slug: 'infoCards',
    labels: { singular: 'Praktische info', plural: 'Praktische info' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'textarea' },
      {
        name: 'items',
        type: 'array',
        minRows: 2,
        maxRows: 6,
        required: true,
        fields: [
          { name: 'label', type: 'text', required: true },
          { name: 'value', type: 'text', required: true },
          { name: 'detail', type: 'textarea' },
          linkFields('link'),
        ],
      },
      linkFields('link'),
      appearanceFields('yellow'),
    ],
  },
  fixture: {
    block: {
      blockType: 'infoCards',
      heading: 'Praktisch',
      items: [
        { label: 'Wanneer', value: 'Donderdag' },
        { label: 'Waar', value: 'Leuven' },
      ],
    },
    expectedText: 'Donderdag',
  },
  render: ({ block, locale }) => (
    <Section
      className="info-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'yellow')}
    >
      <Container width={block.appearance?.width}>
        <SectionHeader heading={block.heading} intro={block.intro} />
        <dl
          className={`info-list${block.items.some((item) => (item.detail?.length || 0) > 90) ? ' info-list--detailed' : ''}`}
        >
          {block.items.map((item, index) => (
            <div className="info-row" key={item.id || index}>
              <dt>{item.label}</dt>
              <dd>
                <strong>{item.value}</strong>
                {item.detail && <small>{item.detail}</small>}
                {item.link?.label && (
                  <SmartLink className="info-row__link" link={item.link} locale={locale}>
                    {item.link.label}
                  </SmartLink>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <ButtonLink link={block.link} locale={locale} variant="secondary" />
      </Container>
    </Section>
  ),
})
