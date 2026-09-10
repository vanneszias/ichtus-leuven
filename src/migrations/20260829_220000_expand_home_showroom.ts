import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import type { Locale } from '@/lib/content'
import type { Page } from '@/payload-types'
import { homeLayoutEN, homeLayoutNL } from '@/seed/home'
import { ensureHomeShowroomMedia, homeLayoutWithMedia } from '@/seed/homeMedia'

async function homePage(payload: MigrateUpArgs['payload']) {
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    fallbackLocale: false,
    limit: 1,
    locale: 'nl',
    overrideAccess: true,
    where: { slug: { equals: 'home' } },
  })
  return result.docs[0]
}

async function updateImages(
  { payload, req }: Pick<MigrateUpArgs, 'payload' | 'req'>,
  pageID: Page['id'],
  locale: Locale,
  sourceLayout: Page['layout'],
  expanded: boolean,
) {
  const page = await payload.findByID({
    collection: 'pages',
    id: pageID,
    draft: true,
    fallbackLocale: false,
    locale,
    overrideAccess: true,
  })
  const source = sourceLayout.find((block) => block.blockType === 'photoStory')
  if (!source || source.blockType !== 'photoStory') return

  const layout = page.layout.map((block) =>
    block.blockType === 'photoStory'
      ? { ...block, images: expanded ? source.images : source.images.slice(0, 2) }
      : block,
  )

  await payload.update({
    collection: 'pages',
    id: pageID,
    locale,
    overrideAccess: true,
    req,
    data: { layout, _status: 'published' },
  })
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const home = await homePage(payload)
  if (!home) return
  const media = await ensureHomeShowroomMedia(payload)
  await updateImages(
    { payload, req },
    home.id,
    'nl',
    homeLayoutWithMedia(homeLayoutNL, media),
    true,
  )
  await updateImages(
    { payload, req },
    home.id,
    'en',
    homeLayoutWithMedia(homeLayoutEN, media),
    true,
  )
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const home = await homePage(payload)
  if (!home) return
  const media = await ensureHomeShowroomMedia(payload)
  await updateImages(
    { payload, req },
    home.id,
    'nl',
    homeLayoutWithMedia(homeLayoutNL, media),
    false,
  )
  await updateImages(
    { payload, req },
    home.id,
    'en',
    homeLayoutWithMedia(homeLayoutEN, media),
    false,
  )
}
