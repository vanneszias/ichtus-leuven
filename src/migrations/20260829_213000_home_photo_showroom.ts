import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import type { Locale } from '@/lib/content'
import type { Page } from '@/payload-types'
import { homeLayoutEN, homeLayoutNL } from '@/seed/home'

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

async function updateShowroom(
  { payload, req }: Pick<MigrateUpArgs, 'payload' | 'req'>,
  pageID: Page['id'],
  locale: Locale,
  sourceLayout: Page['layout'],
  enabled: boolean,
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

  const layout = page.layout.map((block) => {
    if (block.blockType !== 'photoStory') return block
    return enabled
      ? { ...block, images: source.images, layout: 'showroom' as const }
      : { ...block, images: block.images.slice(0, 1), layout: 'wide' as const }
  })

  await payload.update({
    collection: 'pages',
    id: pageID,
    locale,
    overrideAccess: true,
    req,
    data: { layout, _status: 'published' },
  })
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE pages_blocks_photo_story_images ADD image_id integer REFERENCES media(id);`,
  )
  await db.run(
    sql`CREATE INDEX pages_blocks_photo_story_images_image_idx ON pages_blocks_photo_story_images (image_id);`,
  )
  await db.run(
    sql`ALTER TABLE _pages_v_blocks_photo_story_images ADD image_id integer REFERENCES media(id);`,
  )
  await db.run(
    sql`CREATE INDEX _pages_v_blocks_photo_story_images_image_idx ON _pages_v_blocks_photo_story_images (image_id);`,
  )

  const home = await homePage(payload)
  if (!home) return
  await updateShowroom({ payload, req }, home.id, 'nl', homeLayoutNL, true)
  await updateShowroom({ payload, req }, home.id, 'en', homeLayoutEN, true)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const home = await homePage(payload)
  if (home) {
    await updateShowroom({ payload, req }, home.id, 'nl', homeLayoutNL, false)
    await updateShowroom({ payload, req }, home.id, 'en', homeLayoutEN, false)
  }

  await db.run(sql`DROP INDEX pages_blocks_photo_story_images_image_idx;`)
  await db.run(sql`ALTER TABLE pages_blocks_photo_story_images DROP COLUMN image_id;`)
  await db.run(sql`DROP INDEX _pages_v_blocks_photo_story_images_image_idx;`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_photo_story_images DROP COLUMN image_id;`)
}
