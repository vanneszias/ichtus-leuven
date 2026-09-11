import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`short_links\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`code\` text NOT NULL,
  	\`destination_type\` text DEFAULT 'url',
  	\`destination_url\` text,
  	\`destination_page_id\` integer,
  	\`destination_event_id\` integer,
  	\`active\` integer DEFAULT true,
  	\`expires_at\` text,
  	\`click_count\` numeric DEFAULT 0,
  	\`last_clicked_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`destination_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`destination_event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`short_links_code_idx\` ON \`short_links\` (\`code\`);`)
  await db.run(
    sql`CREATE INDEX \`short_links_destination_destination_page_idx\` ON \`short_links\` (\`destination_page_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`short_links_destination_destination_event_idx\` ON \`short_links\` (\`destination_event_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`short_links_updated_at_idx\` ON \`short_links\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`short_links_created_at_idx\` ON \`short_links\` (\`created_at\`);`,
  )

  await db.run(sql`CREATE TABLE \`short_link_clicks\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`link_id\` integer NOT NULL,
  	\`referrer\` text,
  	\`country\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`link_id\`) REFERENCES \`short_links\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`short_link_clicks_link_idx\` ON \`short_link_clicks\` (\`link_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`short_link_clicks_updated_at_idx\` ON \`short_link_clicks\` (\`updated_at\`);`,
  )
  // Retention prunes the oldest rows first, so the age of a click is the one
  // column the maintenance run sorts and filters on.
  await db.run(
    sql`CREATE INDEX \`short_link_clicks_created_at_idx\` ON \`short_link_clicks\` (\`created_at\`);`,
  )

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`short_links_id\` integer REFERENCES short_links(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_short_links_id_idx\` ON \`payload_locked_documents_rels\` (\`short_links_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`short_link_clicks_id\` integer REFERENCES short_link_clicks(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_short_link_clicks_id_idx\` ON \`payload_locked_documents_rels\` (\`short_link_clicks_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_short_link_clicks_id_idx\`;`,
  )
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_short_links_id_idx\`;`)
  // SQLite cannot drop a column that a foreign key references, and rebuilding
  // the lock table would cost more than leaving two always-null columns behind
  // on a rollback.
  await db.run(sql`DROP TABLE IF EXISTS \`short_link_clicks\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`short_links\`;`)
}
