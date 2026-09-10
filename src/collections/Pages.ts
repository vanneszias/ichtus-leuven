import type { CollectionConfig } from 'payload'
import { contentManagers, publishedOrAuthenticated } from '@/access'
import { pageBlocks } from '@/blocks'
import { siteURL } from '@/lib/runtimeConfig'

export function validateUniquePageAnchors(value: unknown): true | string {
  if (!Array.isArray(value)) return true

  const anchors = value
    .map((block) => {
      if (!block || typeof block !== 'object') return null
      const appearance = (block as { appearance?: unknown }).appearance
      if (!appearance || typeof appearance !== 'object') return null
      const anchor = (appearance as { anchor?: unknown }).anchor
      return typeof anchor === 'string' && anchor ? anchor : null
    })
    .filter((anchor): anchor is string => Boolean(anchor))
  const duplicate = anchors.find((anchor, index) => anchors.indexOf(anchor) !== index)

  return duplicate ? `Het anker “${duplicate}” komt meer dan één keer voor op deze pagina.` : true
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Pagina', plural: 'Pagina’s' },
  access: {
    create: contentManagers,
    delete: contentManagers,
    read: publishedOrAuthenticated,
    update: contentManagers,
  },
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) => {
        const code = typeof locale === 'string' ? locale : locale?.code || 'nl'
        const slug = data?.slug === 'home' ? '' : data?.slug
        return `${siteURL()}/${code}/preview/${slug || ''}`
      },
    },
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Gebruik “home” voor de startpagina.' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      index: true,
      admin: {
        description: 'Optioneel: toon deze pagina in de sectienavigatie van een hoofdpagina.',
        position: 'sidebar',
      },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    {
      name: 'navigationLabel',
      type: 'text',
      localized: true,
      admin: { description: 'Korte titel voor sectienavigatie.', position: 'sidebar' },
    },
    {
      name: 'navigationOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', step: 1 },
    },
    {
      name: 'sectionTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Titel boven de sectienavigatie van deze hoofdpagina.',
        position: 'sidebar',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: pageBlocks,
      localized: true,
      required: true,
      validate: validateUniquePageAnchors,
    },
    {
      name: 'seo',
      type: 'group',
      localized: true,
      fields: [
        { name: 'title', type: 'text', maxLength: 60 },
        { name: 'description', type: 'textarea', maxLength: 160 },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'noIndex', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
}
