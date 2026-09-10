import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`is_decorative\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`focal_position_x\` numeric DEFAULT 50;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`focal_position_y\` numeric DEFAULT 50;`)
  await db.run(sql`CREATE TABLE \`__new_media_locales\` (
    \`alt\` text,
    \`caption\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` integer NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`INSERT INTO \`__new_media_locales\` (\`alt\`, \`caption\`, \`id\`, \`_locale\`, \`_parent_id\`)
    SELECT \`alt\`, \`caption\`, \`id\`, \`_locale\`, \`_parent_id\` FROM \`media_locales\`;`)
  await db.run(sql`DROP TABLE \`media_locales\`;`)
  await db.run(sql`ALTER TABLE \`__new_media_locales\` RENAME TO \`media_locales\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_locales_locale_parent_id_unique\` ON \`media_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`__old_media_locales\` (
    \`alt\` text NOT NULL,
    \`caption\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` integer NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`INSERT INTO \`__old_media_locales\` (\`alt\`, \`caption\`, \`id\`, \`_locale\`, \`_parent_id\`)
    SELECT coalesce(\`alt\`, ''), \`caption\`, \`id\`, \`_locale\`, \`_parent_id\` FROM \`media_locales\`;`)
  await db.run(sql`DROP TABLE \`media_locales\`;`)
  await db.run(sql`ALTER TABLE \`__old_media_locales\` RENAME TO \`media_locales\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_locales_locale_parent_id_unique\` ON \`media_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`focal_position_y\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`focal_position_x\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`is_decorative\`;`)
}
