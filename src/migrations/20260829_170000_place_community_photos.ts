import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { aboutLayout } from '@/seed/about'
import { homeLayoutEN, homeLayoutNL } from '@/seed/home'

async function pageByDutchSlug(payload: MigrateUpArgs['payload'], slug: string) {
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    fallbackLocale: false,
    limit: 1,
    locale: 'nl',
    overrideAccess: true,
    where: { slug: { equals: slug } },
  })
  return result.docs[0]
}

async function updateLocalizedLayouts({ payload, req }: Pick<MigrateUpArgs, 'payload' | 'req'>) {
  const [home, about] = await Promise.all([
    pageByDutchSlug(payload, 'home'),
    pageByDutchSlug(payload, 'over-ons'),
  ])

  if (home) {
    await payload.update({ collection: 'pages', id: home.id, locale: 'nl', overrideAccess: true, req, data: { layout: homeLayoutNL, _status: 'published' } })
    await payload.update({ collection: 'pages', id: home.id, locale: 'en', overrideAccess: true, req, data: { layout: homeLayoutEN, _status: 'published' } })
  }
  if (about) {
    await payload.update({ collection: 'pages', id: about.id, locale: 'nl', overrideAccess: true, req, data: { layout: aboutLayout('nl'), _status: 'published' } })
    await payload.update({ collection: 'pages', id: about.id, locale: 'en', overrideAccess: true, req, data: { layout: aboutLayout('en'), _status: 'published' } })
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE pages_blocks_hero ADD curated_photo text;`)
  await db.run(sql`ALTER TABLE pages_blocks_hero ADD curated_photo_alt text;`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero ADD curated_photo text;`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero ADD curated_photo_alt text;`)

  await updateLocalizedLayouts({ payload, req })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const about = await pageByDutchSlug(payload, 'over-ons')
  if (about) {
    await payload.update({ collection: 'pages', id: about.id, locale: 'nl', overrideAccess: true, req, data: { layout: aboutLayout('nl', { photos: false }), _status: 'published' } })
    await payload.update({ collection: 'pages', id: about.id, locale: 'en', overrideAccess: true, req, data: { layout: aboutLayout('en', { photos: false }), _status: 'published' } })
  }

  await db.run(sql`ALTER TABLE pages_blocks_hero DROP COLUMN curated_photo;`)
  await db.run(sql`ALTER TABLE pages_blocks_hero DROP COLUMN curated_photo_alt;`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero DROP COLUMN curated_photo;`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero DROP COLUMN curated_photo_alt;`)
}
