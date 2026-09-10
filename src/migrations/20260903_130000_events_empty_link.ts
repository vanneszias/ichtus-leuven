import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['pages_blocks_events_list', '_pages_v_blocks_events_list']) {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD empty_link_label text;`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD empty_link_type text DEFAULT 'internal';`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD empty_link_page_id integer REFERENCES pages(id);`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD empty_link_url text;`))
    await db.run(sql.raw(`ALTER TABLE ${table} ADD empty_link_new_tab integer DEFAULT false;`))
    await db.run(sql.raw(`CREATE INDEX ${table}_empty_link_page_idx ON ${table} (empty_link_page_id);`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ['pages_blocks_events_list', '_pages_v_blocks_events_list']) {
    await db.run(sql.raw(`DROP INDEX ${table}_empty_link_page_idx;`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN empty_link_label;`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN empty_link_type;`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN empty_link_page_id;`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN empty_link_url;`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN empty_link_new_tab;`))
  }
}
