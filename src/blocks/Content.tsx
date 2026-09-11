import { RichText } from '@payloadcms/richtext-lexical/react'
import { cloneElement, isValidElement, type ReactNode } from 'react'

import { ResponsiveMedia } from '@/components/blocks/shared'
import { Container, Section } from '@/components/ui/Section'
import { NewWindowAnnouncement } from '@/components/ui/SmartLink'
import { appearanceFields } from '@/fields/appearance'

import { pageRichTextEditor, validatePageRichTextHeadings } from './schemaFields'
import { definePagePattern, theme } from './types'

export const contentPattern = definePagePattern({
  schema: {
    slug: 'content',
    labels: { singular: 'Tekstsectie', plural: 'Tekstsecties' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      {
        name: 'body',
        type: 'richText',
        editor: pageRichTextEditor,
        validate: validatePageRichTextHeadings,
      },
      {
        name: 'items',
        type: 'array',
        maxRows: 8,
        fields: [{ name: 'label', type: 'text', required: true }],
      },
      { name: 'image', type: 'upload', relationTo: 'media' },
      {
        name: 'layout',
        type: 'select',
        defaultValue: 'split',
        options: [
          { label: 'Twee kolommen', value: 'split' },
          { label: 'Tekst centraal', value: 'centered' },
          { label: 'Afbeelding links', value: 'imageLeft' },
          { label: 'Afbeelding rechts', value: 'imageRight' },
        ],
      },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'content',
      heading: 'Ruimte voor vragen',
      items: [{ label: 'Iedereen is welkom' }],
    },
    expectedText: 'Iedereen is welkom',
  },
  render: ({ block, locale }) => (
    <Section
      className={`content-section content-section--${block.layout || 'split'}`}
      id={block.appearance?.anchor || undefined}
      spacing={block.appearance?.spacing}
      theme={theme(block, 'white')}
    >
      <Container className="content-grid" width={block.appearance?.width}>
        <div className="content-heading">
          <h2>{block.heading}</h2>
        </div>
        <div className="prose">
          {block.image && (
            <figure className="content-media">
              {/* The prose column is the 0.8fr half of a 1.05fr/0.8fr grid inside
                  a max-1200px container, so it settles at 476px and collapses to
                  a single column at 850px. The shared default assumes 50vw/600px
                  and over-fetches here. */}
              <ResponsiveMedia
                media={block.image}
                sizes={
                  block.layout === 'centered'
                    ? '(max-width: 680px) calc(100vw - 28px), 680px'
                    : '(max-width: 680px) calc(100vw - 28px), (max-width: 850px) calc(100vw - 64px), (max-width: 1264px) calc(40vw - 28px), 476px'
                }
              />
            </figure>
          )}
          {block.body && (
            <RichText
              converters={({ defaultConverters }) => {
                const appendAnnouncement = (converted: ReactNode, newTab?: boolean | null) => {
                  if (!newTab || !isValidElement<{ children?: ReactNode }>(converted))
                    return converted
                  return cloneElement(
                    converted,
                    undefined,
                    converted.props.children,
                    <NewWindowAnnouncement locale={locale} />,
                  )
                }

                return {
                  ...defaultConverters,
                  autolink: (args) => {
                    const converter = defaultConverters.autolink
                    const converted = typeof converter === 'function' ? converter(args) : converter
                    return appendAnnouncement(converted, args.node.fields?.newTab)
                  },
                  link: (args) => {
                    const converter = defaultConverters.link
                    const converted = typeof converter === 'function' ? converter(args) : converter
                    return appendAnnouncement(converted, args.node.fields?.newTab)
                  },
                }
              }}
              data={block.body}
            />
          )}
          {block.items?.length ? (
            <ul className="line-list">
              {block.items.map((item, index) => (
                <li key={item.id || index}>{item.label}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </Section>
  ),
})
