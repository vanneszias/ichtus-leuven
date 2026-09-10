import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_insert\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_update\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`events_capacity_update\`;`)

  await db.run(sql`UPDATE \`events\` SET \`capacity\` = MAX(1, CAST(\`capacity\` AS INTEGER))
    WHERE \`capacity\` IS NOT NULL AND (\`capacity\` < 1 OR \`capacity\` != CAST(\`capacity\` AS INTEGER));`)
  await db.run(sql`UPDATE \`_events_v\` SET \`version_capacity\` = MAX(1, CAST(\`version_capacity\` AS INTEGER))
    WHERE \`version_capacity\` IS NOT NULL AND (\`version_capacity\` < 1 OR \`version_capacity\` != CAST(\`version_capacity\` AS INTEGER));`)

  await db.run(sql`CREATE TRIGGER \`events_capacity_insert_valid\`
    BEFORE INSERT ON \`events\`
    WHEN NEW.\`capacity\` IS NOT NULL AND (NEW.\`capacity\` < 1 OR NEW.\`capacity\` != CAST(NEW.\`capacity\` AS INTEGER))
    BEGIN SELECT RAISE(ABORT, 'EVENT_CAPACITY_INVALID'); END;`)
  await db.run(sql`CREATE TRIGGER \`events_capacity_update\`
    BEFORE UPDATE OF \`capacity\` ON \`events\`
    WHEN NEW.\`capacity\` IS NOT NULL
    BEGIN
      SELECT CASE
        WHEN NEW.\`capacity\` < 1 OR NEW.\`capacity\` != CAST(NEW.\`capacity\` AS INTEGER)
        THEN RAISE(ABORT, 'EVENT_CAPACITY_INVALID')
      END;
      SELECT CASE WHEN (
        SELECT COUNT(*) FROM \`registrations\`
        WHERE \`event_id\` = NEW.\`id\` AND \`status\` = 'confirmed'
      ) > NEW.\`capacity\` THEN RAISE(ABORT, 'EVENT_CAPACITY_BELOW_CONFIRMED') END;
    END;`)
  await db.run(sql`CREATE TRIGGER \`_events_v_capacity_insert_valid\`
    BEFORE INSERT ON \`_events_v\`
    WHEN NEW.\`version_capacity\` IS NOT NULL AND (NEW.\`version_capacity\` < 1 OR NEW.\`version_capacity\` != CAST(NEW.\`version_capacity\` AS INTEGER))
    BEGIN SELECT RAISE(ABORT, 'EVENT_CAPACITY_INVALID'); END;`)
  await db.run(sql`CREATE TRIGGER \`_events_v_capacity_update_valid\`
    BEFORE UPDATE OF \`version_capacity\` ON \`_events_v\`
    WHEN NEW.\`version_capacity\` IS NOT NULL AND (NEW.\`version_capacity\` < 1 OR NEW.\`version_capacity\` != CAST(NEW.\`version_capacity\` AS INTEGER))
    BEGIN SELECT RAISE(ABORT, 'EVENT_CAPACITY_INVALID'); END;`)

  await db.run(sql`CREATE TRIGGER \`registrations_capacity_insert\`
    BEFORE INSERT ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed'
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed') >= (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
  await db.run(sql`CREATE TRIGGER \`registrations_capacity_update\`
    BEFORE UPDATE OF \`status\`, \`event_id\` ON \`registrations\`
    WHEN NEW.\`status\` = 'confirmed' AND (OLD.\`status\` != 'confirmed' OR OLD.\`event_id\` != NEW.\`event_id\`)
      AND (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`) IS NOT NULL
      AND (SELECT COUNT(*) FROM \`registrations\` WHERE \`event_id\` = NEW.\`event_id\` AND \`status\` = 'confirmed' AND \`id\` != OLD.\`id\`) >= (SELECT \`capacity\` FROM \`events\` WHERE \`id\` = NEW.\`event_id\`)
    BEGIN SELECT RAISE(ABORT, 'REGISTRATION_CAPACITY_REACHED'); END;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TRIGGER IF EXISTS \`events_capacity_insert_valid\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`_events_v_capacity_insert_valid\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`_events_v_capacity_update_valid\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_insert\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`registrations_capacity_update\`;`)
  await db.run(sql`DROP TRIGGER IF EXISTS \`events_capacity_update\`;`)

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
