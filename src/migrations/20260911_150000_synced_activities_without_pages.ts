import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Synchronization used to give every activity it imported a page of its own,
 * so a calendar entry that says nothing beyond a title, a time and a place
 * became a thin page nobody wrote. It now imports those without one, and the
 * activities already imported are brought to the same state.
 *
 * Only the ones no editor ever worked on: an image, an internal registration,
 * a capacity or a body is somebody deciding the activity has a page worth
 * opening, and that decision stands. A summary is not such a signal because
 * synchronization writes one itself from the calendar description.
 *
 * The address each activity already holds is left in place, so turning a page
 * back on is one setting rather than a slug to invent again in both locales.
 */
const UNTOUCHED = sql`\`source\` = 'google'
  AND \`image_id\` IS NULL
  AND (\`registration_mode\` IS NULL OR \`registration_mode\` = 'none')
  AND \`capacity\` IS NULL
  AND \`id\` NOT IN (
    SELECT \`_parent_id\` FROM \`events_locales\`
    WHERE \`body\` IS NOT NULL AND TRIM(\`body\`) <> ''
  )`

/**
 * The admin panel reads a draft from the version tables, so an editor opening
 * one of these activities has to see the setting that is live rather than the
 * page it used to have, which saving would write straight back.
 */
async function applyToVersions({ db }: MigrateUpArgs | MigrateDownArgs, detail: string) {
  await db.run(sql`UPDATE \`_events_v\` SET \`version_detail\` = ${detail}
    WHERE \`parent_id\` IN (SELECT \`id\` FROM \`events\` WHERE \`detail\` = ${detail});`)
}

export async function up(args: MigrateUpArgs): Promise<void> {
  await args.db.run(sql`UPDATE \`events\` SET \`detail\` = 'none'
    WHERE \`detail\` = 'page' AND ${UNTOUCHED};`)
  await applyToVersions(args, 'none')
}

/* Restores the old default: every untouched synchronized activity gets its
   page back. That includes the ones imported after this migration ran, which
   is the state they would have been created in beforehand anyway. */
export async function down(args: MigrateDownArgs): Promise<void> {
  await args.db.run(sql`UPDATE \`events\` SET \`detail\` = 'page'
    WHERE \`detail\` = 'none' AND ${UNTOUCHED};`)
  await applyToVersions(args, 'page')
}
