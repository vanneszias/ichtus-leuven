import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings_navigation_locales\` ADD \`link_url\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings_footer_links_locales\` ADD \`link_url\` text;`)
  await db.run(sql`
    UPDATE \`site_settings_navigation_locales\`
    SET \`link_url\` = (
      SELECT CASE
        WHEN \`site_settings_navigation_locales\`.\`_locale\` = 'nl' AND \`site_settings_navigation\`.\`link_url\` = '#calendar' THEN '#agenda'
        WHEN \`site_settings_navigation_locales\`.\`_locale\` = 'nl' AND \`site_settings_navigation\`.\`link_url\` = '#join-us' THEN '#kom-mee'
        WHEN \`site_settings_navigation_locales\`.\`_locale\` = 'nl' AND \`site_settings_navigation\`.\`link_url\` = '#about-us' THEN '#over-ons'
        ELSE \`site_settings_navigation\`.\`link_url\`
      END
      FROM \`site_settings_navigation\`
      WHERE \`site_settings_navigation\`.\`id\` = \`site_settings_navigation_locales\`.\`_parent_id\`
    );
  `)
  await db.run(sql`
    UPDATE \`site_settings_footer_links_locales\`
    SET \`link_url\` = (
      SELECT \`site_settings_footer_links\`.\`link_url\`
      FROM \`site_settings_footer_links\`
      WHERE \`site_settings_footer_links\`.\`id\` = \`site_settings_footer_links_locales\`.\`_parent_id\`
    );
  `)
  await db.run(sql`ALTER TABLE \`site_settings_navigation\` DROP COLUMN \`link_url\`;`)
  await db.run(sql`ALTER TABLE \`site_settings_footer_links\` DROP COLUMN \`link_url\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings_navigation\` ADD \`link_url\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings_footer_links\` ADD \`link_url\` text;`)
  await db.run(sql`
    UPDATE \`site_settings_navigation\`
    SET \`link_url\` = (
      SELECT \`site_settings_navigation_locales\`.\`link_url\`
      FROM \`site_settings_navigation_locales\`
      WHERE \`site_settings_navigation_locales\`.\`_parent_id\` = \`site_settings_navigation\`.\`id\`
      ORDER BY CASE \`site_settings_navigation_locales\`.\`_locale\` WHEN 'nl' THEN 0 ELSE 1 END
      LIMIT 1
    );
  `)
  await db.run(sql`
    UPDATE \`site_settings_footer_links\`
    SET \`link_url\` = (
      SELECT \`site_settings_footer_links_locales\`.\`link_url\`
      FROM \`site_settings_footer_links_locales\`
      WHERE \`site_settings_footer_links_locales\`.\`_parent_id\` = \`site_settings_footer_links\`.\`id\`
      ORDER BY CASE \`site_settings_footer_links_locales\`.\`_locale\` WHEN 'nl' THEN 0 ELSE 1 END
      LIMIT 1
    );
  `)
  await db.run(sql`ALTER TABLE \`site_settings_navigation_locales\` DROP COLUMN \`link_url\`;`)
  await db.run(sql`ALTER TABLE \`site_settings_footer_links_locales\` DROP COLUMN \`link_url\`;`)
}
