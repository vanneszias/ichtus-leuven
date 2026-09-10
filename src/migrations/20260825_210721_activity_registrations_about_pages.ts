import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`registrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`event_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`locale\` text NOT NULL,
  	\`status\` text DEFAULT 'confirmed' NOT NULL,
  	\`cancelled_at\` text,
  	\`confirmation_sent_at\` text,
  	\`email_status\` text DEFAULT 'pending',
  	\`email_last_error\` text,
  	\`admin_notes\` text,
  	\`active_key\` text,
  	\`cancellation_token_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`registrations_event_idx\` ON \`registrations\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registrations_email_idx\` ON \`registrations\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`registrations_status_idx\` ON \`registrations\` (\`status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_active_key_idx\` ON \`registrations\` (\`active_key\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_cancellation_token_hash_idx\` ON \`registrations\` (\`cancellation_token_hash\`);`)
  await db.run(sql`CREATE INDEX \`registrations_updated_at_idx\` ON \`registrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registrations_created_at_idx\` ON \`registrations\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_info_cards_items\` ADD \`link_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_info_cards_items\` ADD \`link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_info_cards_items\` ADD \`link_page_id\` integer REFERENCES pages(id);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_info_cards_items\` ADD \`link_url\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_info_cards_items\` ADD \`link_new_tab\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_link_link_page_idx\` ON \`pages_blocks_info_cards_items\` (\`link_page_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_info_cards_items\` ADD \`link_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_info_cards_items\` ADD \`link_type\` text DEFAULT 'internal';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_info_cards_items\` ADD \`link_page_id\` integer REFERENCES pages(id);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_info_cards_items\` ADD \`link_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_info_cards_items\` ADD \`link_new_tab\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_link_link_page_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`link_page_id\`);`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`registration_mode\` text DEFAULT 'none';`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`capacity\` numeric;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`waitlist_enabled\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`registration_opens_at\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`registration_deadline\` text;`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`registration_closed_message\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_registration_mode\` text DEFAULT 'none';`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_capacity\` numeric;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_waitlist_enabled\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_registration_opens_at\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_registration_deadline\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v_locales\` ADD \`version_registration_closed_message\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`role\` text DEFAULT 'admin' NOT NULL;`)
  await db.run(sql`CREATE INDEX \`registrations_event_status_created_idx\` ON \`registrations\` (\`event_id\`, \`status\`, \`created_at\`);`)
  await db.run(sql`CREATE TRIGGER \`registrations_capacity_insert\`
    BEFORE INSERT ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed'
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed') >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN
      SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED');
    END;`)
  await db.run(sql`CREATE TRIGGER \`registrations_capacity_update\`
    BEFORE UPDATE OF \`status\`, \`event_id\` ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed'
      AND (OLD.\`status\` != 'confirmed' OR OLD.\`event_id\` != NEW.\`event_id\`)
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed' AND \`id\` != OLD.\`id\`) >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN
      SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED');
    END;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`registrations_id\` integer REFERENCES registrations(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_registrations_id_idx\` ON \`payload_locked_documents_rels\` (\`registrations_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_insert\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_update\`;`)
  await db.run(sql`DROP TABLE \`registrations\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_info_cards_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	\`detail\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_info_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_info_cards_items\`("_order", "_parent_id", "_locale", "id", "label", "value", "detail") SELECT "_order", "_parent_id", "_locale", "id", "label", "value", "detail" FROM \`pages_blocks_info_cards_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_info_cards_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_info_cards_items\` RENAME TO \`pages_blocks_info_cards_items\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_order_idx\` ON \`pages_blocks_info_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_parent_id_idx\` ON \`pages_blocks_info_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_locale_idx\` ON \`pages_blocks_info_cards_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_info_cards_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	\`detail\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_info_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_info_cards_items\`("_order", "_parent_id", "_locale", "id", "label", "value", "detail", "_uuid") SELECT "_order", "_parent_id", "_locale", "id", "label", "value", "detail", "_uuid" FROM \`_pages_v_blocks_info_cards_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_info_cards_items\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_info_cards_items\` RENAME TO \`_pages_v_blocks_info_cards_items\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_order_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_parent_id_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_locale_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`events_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "events_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "events_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`registration_mode\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`capacity\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`waitlist_enabled\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`registration_opens_at\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`registration_deadline\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`registration_closed_message\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_registration_mode\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_capacity\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_waitlist_enabled\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_registration_opens_at\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_registration_deadline\`;`)
  await db.run(sql`ALTER TABLE \`_events_v_locales\` DROP COLUMN \`version_registration_closed_message\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`role\`;`)
}
