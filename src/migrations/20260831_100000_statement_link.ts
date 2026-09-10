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

async function updateStatementLink(
  { payload, req }: Pick<MigrateUpArgs, 'payload' | 'req'>,
  pageID: Page['id'],
  locale: Locale,
  sourceLayout: Page['layout'],
) {
  const page = await payload.findByID({
    collection: 'pages',
    id: pageID,
    draft: true,
    fallbackLocale: false,
    locale,
    overrideAccess: true,
  })
  const source = sourceLayout.find((block) => block.blockType === 'statement')
  if (!source || source.blockType !== 'statement' || !source.link) return

  const layout = page.layout.map((block) =>
    block.blockType === 'statement' && !block.link?.label ? { ...block, link: source.link } : block,
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

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  for (const table of ['pages_blocks_statement', '_pages_v_blocks_statement']) {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD link_label text;`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD link_type text DEFAULT 'internal';`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD link_page_id integer REFERENCES pages(id);`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD link_url text;`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD link_new_tab integer DEFAULT false;`))
    await db.run(
      sql.raw(`CREATE INDEX ${table}_link_link_page_idx ON ${table} (link_page_id);`),
    )
  }

  const home = await homePage(payload)
  if (!home) return
  await updateStatementLink({ payload, req }, home.id, 'nl', homeLayoutNL)
  await updateStatementLink({ payload, req }, home.id, 'en', homeLayoutEN)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ['pages_blocks_statement', '_pages_v_blocks_statement']) {
    await db.run(sql.raw(`DROP INDEX ${table}_link_link_page_idx;`))
    for (const column of ['link_label', 'link_type', 'link_page_id', 'link_url', 'link_new_tab']) {
      await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN ${column};`))
    }
  }
}
