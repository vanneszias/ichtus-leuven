import { APIError, type CollectionConfig, type TextFieldSingleValidation } from 'payload'

import { anyone, contentManagers } from '@/access'

export const ALLOWED_IMAGE_MIME_TYPES = ['image/avif', 'image/jpeg', 'image/png', 'image/webp']
export const MEDIA_MAX_FILE_SIZE = 8 * 1024 * 1024
export const MEDIA_MAX_DIMENSION = 8000
export const MEDIA_MAX_PIXELS = 25_000_000

export const validateMediaAlt: TextFieldSingleValidation = (value, { siblingData }) => {
  const isDecorative = Boolean(
    (siblingData as { isDecorative?: boolean } | undefined)?.isDecorative,
  )
  return (
    isDecorative ||
    Boolean(value?.trim()) ||
    'Een beschrijving is verplicht voor betekenisvolle afbeeldingen.'
  )
}

export function validateMediaUpload(
  data: Record<string, unknown> | null | undefined,
): true | string {
  if (!data?.mimeType) return true

  const mimeType = String(data.mimeType)
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    return 'Gebruik een AVIF-, JPEG-, PNG- of WebP-afbeelding.'
  }

  const filesize = Number(data.filesize)
  if (!Number.isFinite(filesize) || filesize <= 0 || filesize > MEDIA_MAX_FILE_SIZE) {
    return `Afbeeldingen mogen maximaal ${MEDIA_MAX_FILE_SIZE / 1024 / 1024} MB groot zijn.`
  }

  const width = Number(data.width)
  const height = Number(data.height)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'De afmetingen van deze afbeelding konden niet veilig worden bepaald.'
  }
  if (
    width > MEDIA_MAX_DIMENSION ||
    height > MEDIA_MAX_DIMENSION ||
    width * height > MEDIA_MAX_PIXELS
  ) {
    return `Afbeeldingen mogen maximaal ${MEDIA_MAX_DIMENSION}px per zijde en ${MEDIA_MAX_PIXELS / 1_000_000} megapixel zijn.`
  }

  return true
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: contentManagers,
    delete: contentManagers,
    read: anyone,
    update: contentManagers,
  },
  fields: [
    {
      name: 'isDecorative',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Decoratieve afbeeldingen worden door schermlezers overgeslagen.',
        position: 'sidebar',
      },
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => !siblingData?.isDecorative,
        description: 'Beschrijf de inhoud en functie van de afbeelding in de gekozen taal.',
      },
      validate: validateMediaAlt,
    },
    { name: 'caption', type: 'text', localized: true },
    {
      name: 'focalPosition',
      type: 'group',
      label: 'Focuspunt',
      admin: {
        description: 'Bepaalt welk deel zichtbaar blijft wanneer de afbeelding wordt bijgesneden.',
        position: 'sidebar',
      },
      fields: [
        { name: 'x', type: 'number', defaultValue: 50, min: 0, max: 100, label: 'Horizontaal (%)' },
        { name: 'y', type: 'number', defaultValue: 50, min: 0, max: 100, label: 'Verticaal (%)' },
      ],
    },
    {
      name: 'source',
      type: 'text',
      admin: { description: 'Fotograaf, maker of herkomst.', position: 'sidebar' },
    },
    {
      name: 'capturedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' }, position: 'sidebar' },
    },
    {
      name: 'containsPeople',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publicationConsent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.containsPeople,
        description: 'Bevestig dat herkenbare personen publicatie hebben toegestaan.',
        position: 'sidebar',
      },
      validate: (
        value: boolean | null | undefined,
        { siblingData }: { siblingData?: { containsPeople?: boolean } },
      ) =>
        !siblingData?.containsPeople ||
        value === true ||
        'Publicatietoestemming is verplicht voor herkenbare personen.',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const result = validateMediaUpload({ ...originalDoc, ...data })
        if (result !== true) throw new APIError(result, 400, null, true)
        return data
      },
    ],
  },
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
    mimeTypes: ALLOWED_IMAGE_MIME_TYPES,
  },
}
