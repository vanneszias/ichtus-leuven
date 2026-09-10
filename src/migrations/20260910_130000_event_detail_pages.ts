import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

import { eventSlugFromTitle } from '@/lib/events'

const BLOCK_TABLES = [
  { parent: 'pages', table: 'pages_blocks_calendar' },
  { parent: '_pages_v', table: '_pages_v_blocks_calendar' },
]

/**
 * Every Event used to have a detail page at its numeric identifier, so the
 * schema default keeps that promise and each existing Event needs the slug
 * that now addresses it. Titles repeat across a term, so the derived slugs are
 * de-duplicated per locale exactly like the collection hook does.
 */
async function backfillEventSlugs({ db }: MigrateUpArgs): Promise<void> {
  const rows = (await db.all(
    sql`SELECT \`id\`, \`_locale\`, \`_parent_id\`, \`title\` FROM \`events_locales\` ORDER BY \`_parent_id\`;`,
  )) as { _locale: string; _parent_id: number; id: number; title: string | null }[]
  const takenPerLocale = new Map<string, Set<string>>()

  for (const row of rows) {
    const base = eventSlugFromTitle(row.title || '') || `activiteit-${row._parent_id}`
    const taken = takenPerLocale.get(row._locale) || new Set<string>()
    let slug = base
    for (let attempt = 2; taken.has(slug); attempt += 1) slug = `${base}-${attempt}`
    taken.add(slug)
    takenPerLocale.set(row._locale, taken)
    await db.run(sql`UPDATE \`events_locales\` SET \`slug\` = ${slug} WHERE \`id\` = ${row.id};`)
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  const { db } = args

  await db.run(sql`ALTER TABLE \`events\` ADD \`detail\` text DEFAULT 'page';`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_detail\` text DEFAULT 'page';`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`detail_url\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_detail_url\` text;`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`slug\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v_locales\` ADD \`version_slug\` text;`)

  await backfillEventSlugs(args)
  // Drafts are read from the version tables, so an editor opening an existing
  // Event has to see the slug that is already live rather than an empty field
  // the collection hook would fill with a de-duplicated variant.
  await db.run(sql`UPDATE \`_events_v_locales\` SET \`version_slug\` = (
    SELECT \`events_locales\`.\`slug\`
    FROM \`events_locales\`
    JOIN \`_events_v\` ON \`_events_v\`.\`parent_id\` = \`events_locales\`.\`_parent_id\`
    WHERE \`_events_v\`.\`id\` = \`_events_v_locales\`.\`_parent_id\`
      AND \`events_locales\`.\`_locale\` = \`_events_v_locales\`.\`_locale\`
  );`)

  await db.run(
    sql`CREATE UNIQUE INDEX \`events_slug_idx\` ON \`events_locales\` (\`slug\`,\`_locale\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_events_v_version_version_slug_idx\` ON \`_events_v_locales\` (\`version_slug\`,\`_locale\`);`,
  )

  for (const { parent, table } of BLOCK_TABLES) {
    const isVersion = parent === '_pages_v'
    await db.run(
      sql.raw(`CREATE TABLE \`${table}\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`_locale\` text NOT NULL,
	\`id\` ${isVersion ? 'integer' : 'text'} PRIMARY KEY NOT NULL,
	\`heading\` text,
	\`intro\` text,
	\`empty_message\` text,
	\`appearance_background\` text DEFAULT 'white',
	\`appearance_spacing\` text DEFAULT 'normal',
	\`appearance_width\` text DEFAULT 'standard',
	\`appearance_alignment\` text DEFAULT 'left',
	\`appearance_heading_size\` text DEFAULT 'large',
	\`appearance_anchor\` text,
${isVersion ? '\t`_uuid` text,\n' : ''}	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`${parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`),
    )
    for (const [suffix, column] of [
      ['order_idx', '_order'],
      ['parent_id_idx', '_parent_id'],
      ['path_idx', '_path'],
      ['locale_idx', '_locale'],
    ]) {
      await db.run(
        sql.raw(`CREATE INDEX \`${table}_${suffix}\` ON \`${table}\` (\`${column}\`);`),
      )
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const { table } of BLOCK_TABLES) {
    await db.run(sql.raw(`DROP TABLE \`${table}\`;`))
  }
  await db.run(sql`DROP INDEX \`_events_v_version_version_slug_idx\`;`)
  await db.run(sql`DROP INDEX \`events_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`_events_v_locales\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`slug\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_detail_url\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`detail_url\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_detail\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`detail\`;`)
}
