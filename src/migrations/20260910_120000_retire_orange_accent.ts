import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/* The orange accent was retired: it rendered the same salmon as pink, so every
   stored 'orange' becomes 'pink'. The column list is read from the schema
   because accent and background columns exist on every block table and its
   drafts twin, and new blocks add more. */
const ACCENT_COLUMNS = ['accent', 'appearance_background']

async function accentTables({ db }: MigrateUpArgs | MigrateDownArgs) {
  const tables = (await db.all(
    sql`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND sql IS NOT NULL;`,
  )) as { name: string; sql: string }[]

  return tables.flatMap((table) =>
    ACCENT_COLUMNS.filter((column) => table.sql.includes(`\`${column}\``)).map((column) => ({
      column,
      table: table.name,
    })),
  )
}

export async function up(args: MigrateUpArgs): Promise<void> {
  for (const { column, table } of await accentTables(args)) {
    await args.db.run(
      sql.raw(`UPDATE \`${table}\` SET \`${column}\` = 'pink' WHERE \`${column}\` = 'orange';`),
    )
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /* Irreversible on purpose: once merged into pink, the rows that used to be
     orange are indistinguishable from the ones that were always pink. */
}
