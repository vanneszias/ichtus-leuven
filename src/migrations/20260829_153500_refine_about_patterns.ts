import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { aboutLayout } from '@/seed/about'

function preNetworkLayout(locale: 'nl' | 'en') {
  return aboutLayout(locale, { photos: false }).map((block) => {
    if (block.blockType !== 'networkLinks') return block

    return {
      blockType: 'content' as const,
      heading: block.heading,
      items: block.items.map(({ name }) => ({ label: name })),
      layout: 'split' as const,
      appearance: block.appearance,
    }
  })
}

async function aboutPage(payload: MigrateUpArgs['payload']) {
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    fallbackLocale: false,
    limit: 1,
    locale: 'nl',
    overrideAccess: true,
    where: { slug: { equals: 'over-ons' } },
  })
  return result.docs[0]
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const about = await aboutPage(payload)
  if (!about) return

  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'nl',
    overrideAccess: true,
    req,
    data: { layout: aboutLayout('nl', { photos: false }), _status: 'published' },
  })
  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'en',
    overrideAccess: true,
    req,
    data: { layout: aboutLayout('en', { photos: false }), _status: 'published' },
  })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const about = await aboutPage(payload)
  if (!about) return

  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'nl',
    overrideAccess: true,
    req,
    data: { layout: preNetworkLayout('nl'), _status: 'published' },
  })
  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'en',
    overrideAccess: true,
    req,
    data: { layout: preNetworkLayout('en'), _status: 'published' },
  })
}
