import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`registration_deliveries\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`registration_id\` integer NOT NULL,
  	\`event_id\` integer NOT NULL,
  	\`kind\` text NOT NULL,
  	\`status\` text DEFAULT 'pending' NOT NULL,
  	\`attempts\` numeric DEFAULT 0 NOT NULL,
  	\`next_attempt_at\` text,
  	\`locked_at\` text,
  	\`sent_at\` text,
  	\`last_error\` text,
  	\`idempotency_key\` text NOT NULL,
  	\`encrypted_payload\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`registration_id\`) REFERENCES \`registrations\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`registration_deliveries_registration_idx\` ON \`registration_deliveries\` (\`registration_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_event_idx\` ON \`registration_deliveries\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_status_idx\` ON \`registration_deliveries\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_next_attempt_at_idx\` ON \`registration_deliveries\` (\`next_attempt_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registration_deliveries_idempotency_key_idx\` ON \`registration_deliveries\` (\`idempotency_key\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_updated_at_idx\` ON \`registration_deliveries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_created_at_idx\` ON \`registration_deliveries\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`registration_deliveries_id\` integer REFERENCES registration_deliveries(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_registration_deliveries_id_idx\` ON \`payload_locked_documents_rels\` (\`registration_deliveries_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`registration_deliveries\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`events_id\` integer,
  	\`registrations_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`registrations_id\`) REFERENCES \`registrations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "events_id", "registrations_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "events_id", "registrations_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_registrations_id_idx\` ON \`payload_locked_documents_rels\` (\`registrations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
