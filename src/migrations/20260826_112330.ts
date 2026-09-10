import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`source\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`captured_at\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`contains_people\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`publication_consent\` integer DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`source\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`captured_at\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`contains_people\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`publication_consent\`;`)
}
