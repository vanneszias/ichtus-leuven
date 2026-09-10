import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`calendar_sync_state\` (
    \`source\` text PRIMARY KEY NOT NULL,
    \`page_token\` text,
    \`sync_token\` text,
    \`updated_at\` text NOT NULL
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`calendar_sync_state\`;`)
}
