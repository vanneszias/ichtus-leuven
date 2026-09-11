import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * An activity page carried only a title, a date and a one-paragraph summary,
 * which is too little for the activities that need a programme, a route
 * description or a list of what to bring. The field is localized like the rest
 * of the editorial copy, so it lands in the locale tables, and the version
 * tables get it too because the admin panel reads a draft from there.
 */
const BODY_COLUMNS = [
  { column: 'body', table: 'events_locales' },
  { column: 'version_body', table: '_events_v_locales' },
]

async function existingColumns({ db }: MigrateUpArgs | MigrateDownArgs) {
  const tables = (await db.all(
    sql`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND sql IS NOT NULL;`,
  )) as { name: string; sql: string }[]

  return BODY_COLUMNS.filter(({ column, table }) =>
    tables.some((row) => row.name === table && row.sql.includes(`\`${column}\``)),
  )
}

export async function up(args: MigrateUpArgs): Promise<void> {
  const present = await existingColumns(args)
  for (const { column, table } of BODY_COLUMNS) {
    if (present.some((entry) => entry.column === column)) continue
    await args.db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` text;`))
  }
}

/* Dropping the column discards the prose an editor wrote, which is the only
   thing this migration ever added; nothing else references it. */
export async function down(args: MigrateDownArgs): Promise<void> {
  for (const { column, table } of await existingColumns(args)) {
    await args.db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`))
  }
}
