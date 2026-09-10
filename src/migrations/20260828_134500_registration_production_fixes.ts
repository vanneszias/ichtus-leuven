import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`INSERT OR IGNORE INTO \`registration_deliveries\`
    (\`registration_id\`, \`event_id\`, \`kind\`, \`status\`, \`attempts\`, \`next_attempt_at\`, \`sent_at\`, \`last_error\`, \`idempotency_key\`, \`encrypted_payload\`, \`updated_at\`, \`created_at\`)
    SELECT r.\`id\`, r.\`event_id\`,
      CASE WHEN r.\`status\` = 'waitlisted' THEN 'waitlisted' WHEN r.\`status\` = 'cancelled' THEN 'cancelled' ELSE 'confirmed' END,
      CASE WHEN r.\`email_status\` = 'sent' THEN 'sent' ELSE 'failed' END,
      CASE WHEN r.\`email_status\` = 'sent' THEN 1 ELSE 8 END,
      NULL, r.\`confirmation_sent_at\`,
      CASE WHEN r.\`email_status\` = 'sent' THEN NULL ELSE COALESCE(r.\`email_last_error\`, 'Legacy delivery requires an administrator resend') END,
      CAST(r.\`id\` AS TEXT) || ':legacy', NULL, r.\`updated_at\`, r.\`created_at\`
    FROM \`registrations\` r
    WHERE NOT EXISTS (SELECT 1 FROM \`registration_deliveries\` d WHERE d.\`registration_id\` = r.\`id\`);`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_insert\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_update\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_registrations\` (
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
    \`lifecycle_transition_id\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE restrict
  );`)
  await db.run(sql`INSERT INTO \`__new_registrations\`
    (\`id\`, \`event_id\`, \`name\`, \`email\`, \`locale\`, \`status\`, \`cancelled_at\`, \`confirmation_sent_at\`, \`email_status\`, \`email_last_error\`, \`admin_notes\`, \`active_key\`, \`cancellation_token_hash\`, \`updated_at\`, \`created_at\`)
    SELECT \`id\`, \`event_id\`, \`name\`, \`email\`, \`locale\`, \`status\`, \`cancelled_at\`, \`confirmation_sent_at\`, \`email_status\`, \`email_last_error\`, \`admin_notes\`, \`active_key\`, \`cancellation_token_hash\`, \`updated_at\`, \`created_at\` FROM \`registrations\`;`)
  await db.run(sql`CREATE TABLE \`__new_registration_deliveries\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`registration_id\` integer NOT NULL,
    \`event_id\` integer NOT NULL,
    \`kind\` text NOT NULL,
    \`status\` text DEFAULT 'pending' NOT NULL,
    \`attempts\` numeric DEFAULT 0 NOT NULL,
    \`next_attempt_at\` text,
    \`locked_at\` text,
    \`lock_token\` text,
    \`sent_at\` text,
    \`provider_message_id\` text,
    \`last_error\` text,
    \`idempotency_key\` text NOT NULL,
    \`encrypted_payload\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`registration_id\`) REFERENCES \`__new_registrations\`(\`id\`) ON UPDATE no action ON DELETE restrict,
    FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE restrict
  );`)
  await db.run(sql`INSERT INTO \`__new_registration_deliveries\`
    (\`id\`, \`registration_id\`, \`event_id\`, \`kind\`, \`status\`, \`attempts\`, \`next_attempt_at\`, \`locked_at\`, \`sent_at\`, \`last_error\`, \`idempotency_key\`, \`encrypted_payload\`, \`updated_at\`, \`created_at\`)
    SELECT \`id\`, \`registration_id\`, \`event_id\`, \`kind\`, \`status\`, \`attempts\`, \`next_attempt_at\`, \`locked_at\`, \`sent_at\`, \`last_error\`, \`idempotency_key\`, \`encrypted_payload\`, \`updated_at\`, \`created_at\` FROM \`registration_deliveries\`;`)
  await db.run(sql`DROP TABLE \`registration_deliveries\`;`)
  await db.run(sql`DROP TABLE \`registrations\`;`)
  await db.run(sql`ALTER TABLE \`__new_registrations\` RENAME TO \`registrations\`;`)
  await db.run(sql`CREATE INDEX \`registrations_event_idx\` ON \`registrations\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registrations_email_idx\` ON \`registrations\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`registrations_status_idx\` ON \`registrations\` (\`status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_active_key_idx\` ON \`registrations\` (\`active_key\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_cancellation_token_hash_idx\` ON \`registrations\` (\`cancellation_token_hash\`);`)
  await db.run(sql`CREATE INDEX \`registrations_lifecycle_transition_id_idx\` ON \`registrations\` (\`lifecycle_transition_id\`);`)
  await db.run(sql`CREATE INDEX \`registrations_updated_at_idx\` ON \`registrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registrations_created_at_idx\` ON \`registrations\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`registrations_event_status_created_idx\` ON \`registrations\` (\`event_id\`, \`status\`, \`created_at\`);`)
  await db.run(sql`ALTER TABLE \`__new_registration_deliveries\` RENAME TO \`registration_deliveries\`;`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_registration_idx\` ON \`registration_deliveries\` (\`registration_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_event_idx\` ON \`registration_deliveries\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_status_idx\` ON \`registration_deliveries\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_next_attempt_at_idx\` ON \`registration_deliveries\` (\`next_attempt_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registration_deliveries_idempotency_key_idx\` ON \`registration_deliveries\` (\`idempotency_key\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_updated_at_idx\` ON \`registration_deliveries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_created_at_idx\` ON \`registration_deliveries\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)

  await db.run(sql`ALTER TABLE \`events\` ADD \`confirm_registration_closure\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`registration_closure_pending_at\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`registration_closure_reason\` text;`)
  await db.run(sql`CREATE INDEX \`events_registration_closure_pending_at_idx\` ON \`events\` (\`registration_closure_pending_at\`);`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_confirm_registration_closure\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_registration_closure_pending_at\` text;`)
  await db.run(sql`ALTER TABLE \`_events_v\` ADD \`version_registration_closure_reason\` text;`)

  await db.run(sql`CREATE TRIGGER \`registrations_capacity_insert\`
    BEFORE INSERT ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed'
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed') >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
  await db.run(sql`CREATE TRIGGER \`registrations_capacity_update\`
    BEFORE UPDATE OF \`status\`, \`event_id\` ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed' AND (OLD.\`status\` != 'confirmed' OR OLD.\`event_id\` != NEW.\`event_id\`)
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed' AND \`id\` != OLD.\`id\`) >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
  await db.run(sql`CREATE TRIGGER \`events_capacity_update\`
    BEFORE UPDATE OF \`capacity\` ON \`events\`
    WHEN NEW.\`capacity\` IS NOT NULL AND (
      SELECT COUNT(*) FROM \`registrations\`
      WHERE \`event_id\` = NEW.\`id\` AND \`status\` = 'confirmed'
    ) > CAST(NEW.\`capacity\` AS INTEGER)
    BEGIN SELECT RAISE(ABORT, 'EVENT_CAPACITY_BELOW_CONFIRMED'); END;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_insert\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_update\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`events_capacity_update\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__old_registration_deliveries\` (
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
  );`)
  await db.run(sql`INSERT INTO \`__old_registration_deliveries\`
    (\`id\`, \`registration_id\`, \`event_id\`, \`kind\`, \`status\`, \`attempts\`, \`next_attempt_at\`, \`locked_at\`, \`sent_at\`, \`last_error\`, \`idempotency_key\`, \`encrypted_payload\`, \`updated_at\`, \`created_at\`)
    SELECT \`id\`, \`registration_id\`, \`event_id\`, \`kind\`, \`status\`, \`attempts\`, \`next_attempt_at\`, \`locked_at\`, \`sent_at\`, \`last_error\`, \`idempotency_key\`, \`encrypted_payload\`, \`updated_at\`, \`created_at\` FROM \`registration_deliveries\`;`)
  await db.run(sql`DROP TABLE \`registration_deliveries\`;`)
  await db.run(sql`ALTER TABLE \`__old_registration_deliveries\` RENAME TO \`registration_deliveries\`;`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_registration_idx\` ON \`registration_deliveries\` (\`registration_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_event_idx\` ON \`registration_deliveries\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_status_idx\` ON \`registration_deliveries\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_next_attempt_at_idx\` ON \`registration_deliveries\` (\`next_attempt_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registration_deliveries_idempotency_key_idx\` ON \`registration_deliveries\` (\`idempotency_key\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_updated_at_idx\` ON \`registration_deliveries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registration_deliveries_created_at_idx\` ON \`registration_deliveries\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`__old_registrations\` (
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
  );`)
  await db.run(sql`INSERT INTO \`__old_registrations\`
    (\`id\`, \`event_id\`, \`name\`, \`email\`, \`locale\`, \`status\`, \`cancelled_at\`, \`admin_notes\`, \`active_key\`, \`cancellation_token_hash\`, \`updated_at\`, \`created_at\`)
    SELECT \`id\`, \`event_id\`, \`name\`, \`email\`, \`locale\`, \`status\`, \`cancelled_at\`, \`admin_notes\`, \`active_key\`, \`cancellation_token_hash\`, \`updated_at\`, \`created_at\` FROM \`registrations\`;`)
  await db.run(sql`DROP TABLE \`registrations\`;`)
  await db.run(sql`ALTER TABLE \`__old_registrations\` RENAME TO \`registrations\`;`)
  await db.run(sql`CREATE INDEX \`registrations_event_idx\` ON \`registrations\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`registrations_email_idx\` ON \`registrations\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`registrations_status_idx\` ON \`registrations\` (\`status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_active_key_idx\` ON \`registrations\` (\`active_key\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`registrations_cancellation_token_hash_idx\` ON \`registrations\` (\`cancellation_token_hash\`);`)
  await db.run(sql`CREATE INDEX \`registrations_updated_at_idx\` ON \`registrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`registrations_created_at_idx\` ON \`registrations\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`registrations_event_status_created_idx\` ON \`registrations\` (\`event_id\`, \`status\`, \`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)

  await db.run(sql`DROP INDEX IF EXISTS \`events_registration_closure_pending_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`confirm_registration_closure\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`registration_closure_pending_at\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`registration_closure_reason\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_confirm_registration_closure\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_registration_closure_pending_at\`;`)
  await db.run(sql`ALTER TABLE \`_events_v\` DROP COLUMN \`version_registration_closure_reason\`;`)

  await db.run(sql`CREATE TRIGGER \`registrations_capacity_insert\`
    BEFORE INSERT ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed'
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed') >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
  await db.run(sql`CREATE TRIGGER \`registrations_capacity_update\`
    BEFORE UPDATE OF \`status\`, \`event_id\` ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed' AND (OLD.\`status\` != 'confirmed' OR OLD.\`event_id\` != NEW.\`event_id\`)
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed' AND \`id\` != OLD.\`id\`) >= (SELECT CAST(\`capacity\` AS INTEGER) FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
}
