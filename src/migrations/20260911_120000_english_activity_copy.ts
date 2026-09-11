import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Activities synchronized from Google Calendar were only ever written in
 * Dutch, and the public site reads one locale without falling back, so the
 * English agenda, calendar and sitemap left every one of them out. The
 * synchronization now seeds the English locale from the calendar entry; the
 * activities that already exist are given the same seed here so they stop
 * being invisible before their next change upstream. The version tables carry
 * it too, because the admin panel reads a draft from there and would otherwise
 * offer an empty English tab over copy that is live.
 */
type LocaleRow = {
  _locale: string
  _parent_id: number
  id: number
  location: string | null
  message: string | null
  slug: string | null
  summary: string | null
  title: string | null
}

const LOCALE_TABLES = [
  { prefix: '', table: 'events_locales' },
  { prefix: 'version_', table: '_events_v_locales' },
]

function filled(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

/** The English address of an activity is its Dutch one, unique per locale. */
function availableSlug(candidate: string | null, taken: Set<string>): string | null {
  if (!filled(candidate)) return null
  let slug = candidate as string
  for (let attempt = 2; taken.has(slug); attempt += 1) slug = `${candidate}-${attempt}`
  taken.add(slug)
  return slug
}

async function seedEnglishRows(
  { db }: MigrateUpArgs,
  { prefix, table }: { prefix: string; table: string },
) {
  const into = sql.raw(`\`${table}\``)
  const column = (name: string) => sql.raw(`\`${prefix}${name}\``)

  const rows = (await db.all(sql`SELECT \`id\`, \`_locale\`, \`_parent_id\`,
      ${column('title')} AS \`title\`, ${column('summary')} AS \`summary\`,
      ${column('location')} AS \`location\`,
      ${column('registration_closed_message')} AS \`message\`,
      ${column('slug')} AS \`slug\`
    FROM ${into} ORDER BY \`_parent_id\`;`)) as LocaleRow[]

  const dutch = new Map<number, LocaleRow>()
  const english = new Map<number, LocaleRow>()
  for (const row of rows) {
    if (row._locale === 'nl') dutch.set(row._parent_id, row)
    if (row._locale === 'en') english.set(row._parent_id, row)
  }
  const takenSlugs = new Set(
    [...english.values()].flatMap((row) => (filled(row.slug) ? [row.slug as string] : [])),
  )

  for (const [parent, source] of dutch) {
    if (!filled(source.title)) continue
    const target = english.get(parent)
    // Copy an editor wrote stays exactly as it is: only a locale that never
    // received a title of its own is seeded.
    if (target && filled(target.title)) continue
    const slug = filled(target?.slug) ? target?.slug : availableSlug(source.slug, takenSlugs)

    if (target) {
      await db.run(sql`UPDATE ${into} SET
        ${column('title')} = ${source.title}, ${column('summary')} = ${source.summary},
        ${column('location')} = ${source.location},
        ${column('registration_closed_message')} = ${source.message},
        ${column('slug')} = ${slug} WHERE \`id\` = ${target.id};`)
      continue
    }
    await db.run(sql`INSERT INTO ${into} (\`_locale\`, \`_parent_id\`,
      ${column('title')}, ${column('summary')}, ${column('location')},
      ${column('registration_closed_message')}, ${column('slug')})
      VALUES ('en', ${parent}, ${source.title}, ${source.summary}, ${source.location},
        ${source.message}, ${slug});`)
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  for (const table of LOCALE_TABLES) await seedEnglishRows(args, table)
}

/* The seeded copy is indistinguishable from copy an editor has since rewritten,
   so it stays: an activity that still reads Dutch on the English site is a
   translation waiting to be made, not a schema to roll back. */
export async function down(_args: MigrateDownArgs): Promise<void> {}
