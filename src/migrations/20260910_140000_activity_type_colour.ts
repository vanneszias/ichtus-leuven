import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/* The colour of an activity now names its type — pale blue for a shared
   evening, salmon for a WILD, an outline for a kringavond — so the editorial
   accent per activity has nothing left to say and is dropped. */
const ACCENT_COLUMNS = [
  { column: 'accent', table: 'events' },
  { column: 'version_accent', table: '_events_v' },
]

async function existingColumns({ db }: MigrateUpArgs | MigrateDownArgs) {
  const tables = (await db.all(
    sql`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND sql IS NOT NULL;`,
  )) as { name: string; sql: string }[]

  return ACCENT_COLUMNS.filter(({ column, table }) =>
    tables.some((row) => row.name === table && row.sql.includes(`\`${column}\``)),
  )
}

export async function up(args: MigrateUpArgs): Promise<void> {
  for (const { column, table } of await existingColumns(args)) {
    await args.db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`))
  }
}

/* The column comes back so the schema matches an older build, but the colours
   themselves are gone: every activity falls back to the default. */
export async function down(args: MigrateDownArgs): Promise<void> {
  const present = await existingColumns(args)
  for (const { column, table } of ACCENT_COLUMNS) {
    if (present.some((entry) => entry.column === column)) continue
    await args.db.run(
      sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` text DEFAULT 'yellow';`),
    )
  }
}
