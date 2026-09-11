import type { CollectionConfig } from 'payload'

import { contentManagers } from '@/access'
import { validateShortLinkCode } from '@/lib/shortLinks'

type DestinationData = { type?: 'activity' | 'page' | 'url' }

export const ShortLinks: CollectionConfig = {
  slug: 'short-links',
  labels: { singular: 'Korte link', plural: 'Korte links' },
  admin: {
    defaultColumns: ['title', 'code', 'clickCount', 'lastClickedAt', 'active'],
    description:
      'Korte adressen onder ichtusleuven.be/… Bezoekers krijgen eerst een bevestigingsscherm met de bestemming.',
    group: 'Korte links',
    useAsTitle: 'title',
  },
  access: {
    create: contentManagers,
    delete: contentManagers,
    // Short links are an internal instrument: the public route resolves one
    // code at a time through the local API, so nothing has to expose the whole
    // list over REST.
    read: contentManagers,
    update: contentManagers,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 120,
      admin: { description: 'Alleen zichtbaar in de beheeromgeving, om de link terug te vinden.' },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateShortLinkCode,
      admin: {
        description: 'Het stuk na de schuine streep: “weekend” wordt ichtusleuven.be/weekend.',
      },
    },
    {
      name: 'destination',
      type: 'group',
      label: 'Bestemming',
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'url',
          options: [
            { label: 'Externe URL', value: 'url' },
            { label: 'Pagina', value: 'page' },
            { label: 'Activiteit', value: 'activity' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          admin: { condition: (_, siblingData) => siblingData?.type === 'url' },
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData?: DestinationData },
          ) => {
            if (siblingData?.type !== 'url') return true
            if (!value) return 'Vul een URL in.'
            // Only http(s): a short code is a public address, so no scheme that
            // could execute in the visitor’s browser may ever end up behind one.
            return /^https?:\/\/\S+$/.test(value.trim()) || 'Gebruik een volledige http(s)-URL.'
          },
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Pagina',
          admin: { condition: (_, siblingData) => siblingData?.type === 'page' },
          validate: (value: unknown, { siblingData }: { siblingData?: DestinationData }) =>
            siblingData?.type !== 'page' || Boolean(value) || 'Kies een pagina.',
        },
        {
          name: 'event',
          type: 'relationship',
          relationTo: 'events',
          label: 'Activiteit',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'activity',
            description: 'De activiteit moet een eigen pagina of externe link hebben.',
          },
          validate: (value: unknown, { siblingData }: { siblingData?: DestinationData }) =>
            siblingData?.type !== 'activity' || Boolean(value) || 'Kies een activiteit.',
        },
      ],
    },
    {
      name: 'qr',
      type: 'ui',
      label: 'QR-code',
      admin: { components: { Field: '@/components/admin/ShortLinkQR' } },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Actief',
      defaultValue: true,
      admin: {
        description: 'Uitgevinkt stuurt bezoekers naar de foutpagina in plaats van de bestemming.',
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Verloopt op',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Optioneel. Na dit moment werkt de korte link niet meer.',
        position: 'sidebar',
      },
    },
    {
      name: 'clickCount',
      type: 'number',
      label: 'Kliks',
      defaultValue: 0,
      admin: {
        description: 'Bij benadering. De exacte tellingen staan bij Kliks.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'lastClickedAt',
      type: 'date',
      label: 'Laatst geklikt',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    // A click row points at its short link with a required relationship, so
    // the rows have to go before the link they would otherwise orphan.
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'short-link-clicks',
          req,
          where: { link: { equals: id } },
        })
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (data?.code) data.code = String(data.code).trim().toLowerCase()
        if (data?.destination?.url) data.destination.url = String(data.destination.url).trim()
        return data
      },
    ],
  },
}
