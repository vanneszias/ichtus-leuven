import Image from 'next/image'
import type { TextFieldSingleValidation } from 'payload'
import { Buttons, DisplayText, ResponsiveMedia } from '@/components/blocks/shared'
import { Container, Section } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'
import { linkFields } from '@/fields/link'
import { curatedPhotoOptions, curatedPhotos } from '@/lib/curatedPhotos'

import { accentOptions } from './schemaFields'
import { definePagePattern, theme } from './types'

const validateCuratedPhotoAlt: TextFieldSingleValidation = (value, { siblingData }) => {
  const data = siblingData as { artStyle?: string; curatedPhoto?: string } | undefined
  return (
    data?.artStyle !== 'image' ||
    !data.curatedPhoto ||
    Boolean(value?.trim()) ||
    'Beschrijf de gekozen foto in de huidige taal.'
  )
}

export const heroPattern = definePagePattern({
  schema: {
    slug: 'hero',
    labels: { singular: 'Hero', plural: 'Hero’s' },
    fields: [
      { name: 'heading', type: 'textarea', required: true },
      { name: 'highlight', type: 'text' },
      { name: 'intro', type: 'textarea', required: true },
      linkFields('primaryLink'),
      linkFields('secondaryLink'),
      {
        name: 'artStyle',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'Foto', value: 'image' },
          { label: 'Geen', value: 'none' },
        ],
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        admin: { condition: (_, siblingData) => siblingData?.artStyle === 'image' },
      },
      {
        name: 'curatedPhoto',
        type: 'select',
        options: curatedPhotoOptions,
        admin: {
          condition: (_, siblingData) => siblingData?.artStyle === 'image',
          description: 'Wordt gebruikt wanneer geen geüploade afbeelding is gekozen.',
        },
      },
      {
        name: 'curatedPhotoAlt',
        type: 'text',
        admin: {
          condition: (_, siblingData) =>
            siblingData?.artStyle === 'image' && Boolean(siblingData?.curatedPhoto),
        },
        validate: validateCuratedPhotoAlt,
      },
      {
        name: 'imagePosition',
        type: 'select',
        defaultValue: 'right',
        options: [
          { label: 'Rechts', value: 'right' },
          { label: 'Links', value: 'left' },
          { label: 'Achtergrond', value: 'background' },
        ],
        admin: { condition: (_, siblingData) => siblingData?.artStyle === 'image' },
      },
      { name: 'accent', type: 'select', defaultValue: 'yellow', options: accentOptions },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'hero',
      heading: 'Welkom bij Ichtus',
      intro: 'Een plek om thuis te komen.',
      artStyle: 'none',
    },
    expectedText: 'Welkom bij Ichtus',
  },
  render: ({ block, imagePriority, locale }) => {
    const uploadedImage =
      block.artStyle === 'image' && typeof block.image === 'object' ? block.image : null
    const curatedPhoto =
      block.artStyle === 'image' && block.curatedPhoto ? curatedPhotos[block.curatedPhoto] : null
    const hasImage = Boolean(uploadedImage || curatedPhoto)
    const imageSizes =
      block.imagePosition === 'background'
        ? '100vw'
        : '(max-width: 680px) calc(100vw - 28px), (max-width: 850px) calc(100vw - 64px), (max-width: 1264px) 40vw, 500px'
    return (
      <Section
        className={`hero hero--${hasImage ? block.imagePosition || 'right' : 'solo'} accent-text-${block.accent || 'pink'}`}
        id={block.appearance?.anchor || undefined}
        spacing={block.appearance?.spacing}
        theme={theme(block, 'white')}
      >
        <Container className="hero__inner" width={block.appearance?.width}>
          <div className="hero__copy">
            <h2>
              <DisplayText highlight={block.highlight} text={block.heading} />
            </h2>
            <p className="lead">{block.intro}</p>
            <Buttons locale={locale} primary={block.primaryLink} secondary={block.secondaryLink} />
          </div>
          {hasImage && (
            <figure className="hero__media">
              {uploadedImage ? (
                <ResponsiveMedia
                  media={uploadedImage}
                  priority={imagePriority}
                  sizes={imageSizes}
                />
              ) : curatedPhoto ? (
                <Image
                  alt={block.curatedPhotoAlt || ''}
                  fetchPriority={imagePriority ? 'high' : undefined}
                  height={curatedPhoto.height}
                  loading={imagePriority ? undefined : 'lazy'}
                  priority={imagePriority}
                  sizes={imageSizes}
                  src={curatedPhoto.src}
                  // Matches ResponsiveMedia and the PhotoStory curated branch, so
                  // the slot is reserved before the bytes arrive.
                  style={{ aspectRatio: `${curatedPhoto.width} / ${curatedPhoto.height}` }}
                  width={curatedPhoto.width}
                />
              ) : null}
            </figure>
          )}
        </Container>
      </Section>
    )
  },
})
