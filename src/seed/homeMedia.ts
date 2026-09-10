import path from 'node:path'

import type { Payload } from 'payload'

import type { Page } from '@/payload-types'

const homeShowroomPhotos = {
  'community-garden-game': {
    altEN: 'Students laugh during a game in the garden.',
    altNL: 'Studenten lachen tijdens een spel in de tuin.',
    filename: 'community-garden-game.webp',
  },
  'community-park': {
    altEN: 'Students sit together in small groups in a park in Leuven.',
    altNL: 'Studenten zitten in groepjes samen in een Leuvens park.',
    filename: 'community-park.webp',
  },
  'community-park-game': {
    altEN: 'Students play a ball game together in the park.',
    altNL: 'Studenten spelen samen een balspel in het park.',
    filename: 'community-park-game.webp',
  },
  'community-prayer': {
    altEN: 'Students stand together in a circle and pray.',
    altNL: 'Studenten staan samen in een kring en bidden.',
    filename: 'community-prayer.webp',
  },
  'community-steps': {
    altEN: 'Students eat and talk together on the steps.',
    altNL: 'Studenten eten en praten samen op de trappen.',
    filename: 'community-steps.webp',
  },
  'community-table': {
    altEN: 'Students talk together around a table full of food.',
    altNL: 'Studenten praten samen rond een tafel vol eten.',
    filename: 'community-table.webp',
  },
} as const

type HomeShowroomPhoto = keyof typeof homeShowroomPhotos
type HomeShowroomMedia = Record<HomeShowroomPhoto, number>

export async function ensureHomeShowroomMedia(payload: Payload): Promise<HomeShowroomMedia> {
  const entries = await Promise.all(
    Object.entries(homeShowroomPhotos).map(async ([key, photo]) => {
      const existing = await payload.find({
        collection: 'media',
        limit: 1,
        locale: 'nl',
        overrideAccess: true,
        where: { filename: { equals: photo.filename } },
      })
      const media =
        existing.docs[0] ||
        (await payload.create({
          collection: 'media',
          locale: 'nl',
          overrideAccess: true,
          filePath: path.resolve(process.cwd(), 'public/photos', photo.filename),
          data: {
            alt: photo.altNL,
            caption: photo.altNL,
            containsPeople: true,
            publicationConsent: true,
            source: 'Ichtus Leuven fotoarchief',
          },
        }))

      await payload.update({
        collection: 'media',
        id: media.id,
        locale: 'en',
        overrideAccess: true,
        data: { alt: photo.altEN, caption: photo.altEN },
      })
      return [key as HomeShowroomPhoto, media.id] as const
    }),
  )

  return Object.fromEntries(entries) as HomeShowroomMedia
}

export function homeLayoutWithMedia(
  layout: Page['layout'],
  media: HomeShowroomMedia,
): Page['layout'] {
  return layout.map((block) =>
    block.blockType === 'photoStory'
      ? {
          ...block,
          images: block.images.map((item) => {
            const imageID = item.photo ? media[item.photo as HomeShowroomPhoto] : undefined
            return imageID ? { ...item, image: imageID, photo: null } : item
          }),
        }
      : block,
  )
}
