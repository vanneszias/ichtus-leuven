import Image from 'next/image'

import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { NewWindowAnnouncement } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'

import { definePagePattern, theme } from './types'

const logoOptions = [
  { label: 'Ichtus Vlaanderen', value: 'ichtus-vlaanderen' },
  { label: 'Ichtus Brussels', value: 'ichtus-brussels' },
  { label: 'Ichtus Antwerpen', value: 'ichtus-antwerpen' },
  { label: 'Ichtus Gent', value: 'ichtus-gent' },
  { label: 'Ichtus Hasselt', value: 'ichtus-hasselt' },
  { label: 'IFES', value: 'ifes' },
]

const logoAssets: Record<string, string> = Object.fromEntries(
  logoOptions.map(({ value }) => [
    value,
    value === 'ichtus-antwerpen' ? '/logos/ichtus-antwerpen-blue.webp' : `/logos/${value}.webp`,
  ]),
)

export const networkLinksPattern = definePagePattern({
  schema: {
    slug: 'networkLinks',
    labels: { singular: 'Netwerklinks', plural: 'Netwerklinks' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      { name: 'intro', type: 'textarea' },
      {
        name: 'items',
        type: 'array',
        minRows: 2,
        maxRows: 8,
        required: true,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'url', type: 'text', required: true },
          { name: 'logo', type: 'select', options: logoOptions, required: true },
        ],
      },
      appearanceFields('green'),
    ],
  },
  fixture: {
    block: {
      blockType: 'networkLinks',
      heading: 'Ons netwerk',
      items: [
        { name: 'Ichtus Vlaanderen', url: 'https://ichtus.be/', logo: 'ichtus-vlaanderen' },
        { name: 'IFES', url: 'https://ifesworld.org/en/', logo: 'ifes' },
      ],
    },
    expectedText: 'Ichtus Vlaanderen',
  },
  render: ({ block, locale }) => (
    <Section
      className="network-section"
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'green')}
    >
      <Container width={block.appearance?.width}>
        <SectionHeader heading={block.heading} intro={block.intro} />
        <ul className="network-grid">
          {block.items?.map((item, index) => {
            const src = logoAssets[item.logo]
            if (!src) return null

            return (
              <li key={item.id || index}>
                <a href={item.url} rel="noopener noreferrer" target="_blank">
                  <span className="network-grid__mark">
                    <Image
                      alt=""
                      height={800}
                      loading="lazy"
                      sizes="(max-width: 680px) calc(100vw - 28px), (max-width: 850px) calc(50vw - 42px), (max-width: 1264px) calc(33vw - 34px), 400px"
                      src={src}
                      width={800}
                    />
                  </span>
                  <span className="network-grid__name">
                    {item.name}
                    <span aria-hidden="true">↗</span>
                    <NewWindowAnnouncement locale={locale} />
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  ),
})
