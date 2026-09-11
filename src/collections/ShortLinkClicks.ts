import type { CollectionConfig } from 'payload'

import { contentManagers } from '@/access'

/**
 * One row per visitor that followed a short link. The counter on the short
 * link itself is a read-modify-write and can lose a click under concurrent
 * traffic; these rows are the exact record, and the only place the referrer
 * and country survive.
 */
export const ShortLinkClicks: CollectionConfig = {
  slug: 'short-link-clicks',
  labels: { singular: 'Klik', plural: 'Kliks' },
  admin: {
    defaultColumns: ['link', 'createdAt', 'referrer', 'country'],
    description: 'Kliks ouder dan twaalf maanden worden automatisch opgeruimd.',
    group: 'Korte links',
    useAsTitle: 'referrer',
  },
  access: {
    // Written by the public route through the local API only.
    create: () => false,
    delete: () => false,
    read: contentManagers,
    update: () => false,
  },
  fields: [
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'short-links',
      label: 'Korte link',
      required: true,
      index: true,
    },
    { name: 'referrer', type: 'text', label: 'Herkomst', maxLength: 255 },
    { name: 'country', type: 'text', label: 'Land', maxLength: 2 },
  ],
}
