import Image from 'next/image'
import type { UploadFieldSingleValidation } from 'payload'

import { ResponsiveMedia } from '@/components/blocks/shared'
import { PhotoShowroom } from '@/components/PhotoShowroom'
import { Container, Section } from '@/components/ui/Section'
import { appearanceFields } from '@/fields/appearance'
import { curatedPhotoOptions, curatedPhotos } from '@/lib/curatedPhotos'

import { definePagePattern, theme } from './types'

const validatePhoto: UploadFieldSingleValidation = (value, { siblingData }) =>
  value || (siblingData as { photo?: string | null })?.photo
    ? true
    : 'Kies een foto uit de mediabibliotheek of de vaste fotoselectie.'

/**
 * Showroom slides letterbox into a 16:9 box (3:2 below 680px) with
 * `object-fit: contain`, so a portrait photo renders far narrower than the
 * container. Scaling `sizes` by the image/box ratio stops the browser from
 * downloading roughly double the pixels it can display (Lighthouse
 * image-delivery finding on the home showroom).
 */
function showroomSizes(width: number, height: number) {
  const ratio = width / height
  const factor = (boxRatio: number) => Math.min(1, Math.round((ratio / boxRatio) * 100) / 100)
  const scale = (base: string, boxRatio: number) => {
    const value = factor(boxRatio)
    return value >= 1 ? `calc(${base})` : `calc((${base}) * ${value.toFixed(2)})`
  }
  const desktopWidth = Math.round(1000 * factor(16 / 9))
  return `(max-width: 680px) ${scale('100vw - 28px', 3 / 2)}, (max-width: 1048px) ${scale('100vw - 48px', 16 / 9)}, ${desktopWidth}px`
}

export const photoStoryPattern = definePagePattern({
  schema: {
    slug: 'photoStory',
    labels: { singular: 'Fotomoment', plural: 'Fotomomenten' },
    fields: [
      {
        name: 'images',
        type: 'array',
        labels: { singular: 'Foto', plural: 'Foto’s' },
        minRows: 1,
        maxRows: 8,
        required: true,
        fields: [
          {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            admin: {
              description:
                'Upload een nieuwe foto of kies een bestaande foto uit de mediabibliotheek.',
            },
            validate: validatePhoto,
          },
          {
            name: 'photo',
            type: 'select',
            options: curatedPhotoOptions,
            admin: {
              description:
                'Optioneel alternatief wanneer geen foto uit de mediabibliotheek is gekozen.',
            },
          },
          {
            name: 'alt',
            type: 'text',
            required: true,
            admin: {
              description:
                'Beschrijf wat er op de foto gebeurt. Deze tekst staat altijd onder de foto.',
            },
          },
        ],
      },
      {
        name: 'layout',
        type: 'select',
        defaultValue: 'editorial',
        options: [
          { label: 'Redactioneel duo', value: 'editorial' },
          { label: 'Breed beeld', value: 'wide' },
          { label: 'Compacte showroom', value: 'showroom' },
        ],
      },
      appearanceFields('white'),
    ],
  },
  fixture: {
    block: {
      blockType: 'photoStory',
      images: [{ photo: 'community-park', alt: 'Studenten zitten samen in een park.' }],
      layout: 'showroom',
    },
    expectedText: 'Studenten zitten samen in een park.',
  },
  render: ({ block, locale }) => {
    const figures = block.images.map((item, index) => {
      const uploadedImage = typeof item.image === 'object' ? item.image : null
      const photo = curatedPhotos[item.photo]
      if (!uploadedImage && !photo) return null
      const dimensions = uploadedImage
        ? { height: uploadedImage.height || 900, width: uploadedImage.width || 1200 }
        : { height: photo.height, width: photo.width }
      const sizes =
        block.layout === 'showroom'
          ? showroomSizes(dimensions.width, dimensions.height)
          : block.layout === 'wide'
            ? '(max-width: 680px) calc(100vw - 28px), (max-width: 1264px) calc(100vw - 64px), 1200px'
            : index === 0
              ? '(max-width: 680px) calc(100vw - 28px), (max-width: 1264px) 68vw, 825px'
              : '(max-width: 680px) calc(84vw - 24px), (max-width: 1264px) 29vw, 350px'

      return (
        <figure key={item.id || index}>
          <div className="photo-story__media">
            {uploadedImage ? (
              <ResponsiveMedia
                media={{ ...uploadedImage, alt: '', isDecorative: true }}
                sizes={sizes}
              />
            ) : photo ? (
              <Image
                alt=""
                height={photo.height}
                loading="lazy"
                sizes={sizes}
                src={photo.src}
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                width={photo.width}
              />
            ) : null}
          </div>
          <figcaption>{item.alt}</figcaption>
        </figure>
      )
    })
    const showroomLabel =
      locale === 'nl'
        ? 'Fotogalerij. Scroll horizontaal voor meer foto’s.'
        : 'Photo gallery. Scroll horizontally for more photos.'

    return (
      <Section
        as="div"
        className={`photo-story photo-story--${block.layout || 'editorial'}`}
        id={block.appearance?.anchor || undefined}
        spacing={block.appearance?.spacing}
        theme={theme(block, 'white')}
      >
        <Container width={block.appearance?.width}>
          {block.layout === 'showroom' ? (
            <PhotoShowroom
              label={showroomLabel}
              pauseLabel={locale === 'nl' ? 'Automatisch afspelen pauzeren' : 'Pause autoplay'}
              playLabel={locale === 'nl' ? 'Automatisch afspelen hervatten' : 'Resume autoplay'}
              statusFormat={
                locale === 'nl' ? 'Foto {index} van {total}' : 'Photo {index} of {total}'
              }
              total={figures.filter(Boolean).length}
            >
              {figures}
            </PhotoShowroom>
          ) : (
            <div className="photo-story__grid">{figures}</div>
          )}
        </Container>
      </Section>
    )
  },
})
