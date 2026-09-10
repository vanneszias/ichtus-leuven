import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { aboutLayout } from '@/seed/about'

async function aboutPage(payload: MigrateUpArgs['payload']) {
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    fallbackLocale: false,
    limit: 1,
    locale: 'nl',
    overrideAccess: true,
    where: { slug: { equals: 'over-ons' } },
  })
  return result.docs[0]
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE pages_blocks_photo_story_images (
    _order integer NOT NULL,
    _parent_id text NOT NULL,
    _locale text NOT NULL,
    id text PRIMARY KEY NOT NULL,
    photo text,
    alt text,
    FOREIGN KEY (_parent_id) REFERENCES pages_blocks_photo_story(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_images_order_idx ON pages_blocks_photo_story_images (_order);`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_images_parent_id_idx ON pages_blocks_photo_story_images (_parent_id);`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_images_locale_idx ON pages_blocks_photo_story_images (_locale);`)
  await db.run(sql`CREATE TABLE pages_blocks_photo_story (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _path text NOT NULL,
    _locale text NOT NULL,
    id text PRIMARY KEY NOT NULL,
    layout text DEFAULT 'editorial',
    appearance_background text DEFAULT 'white',
    appearance_spacing text DEFAULT 'normal',
    appearance_width text DEFAULT 'standard',
    appearance_alignment text DEFAULT 'left',
    appearance_heading_size text DEFAULT 'large',
    appearance_anchor text,
    block_name text,
    FOREIGN KEY (_parent_id) REFERENCES pages(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_order_idx ON pages_blocks_photo_story (_order);`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_parent_id_idx ON pages_blocks_photo_story (_parent_id);`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_path_idx ON pages_blocks_photo_story (_path);`)
  await db.run(sql`CREATE INDEX pages_blocks_photo_story_locale_idx ON pages_blocks_photo_story (_locale);`)
  await db.run(sql`CREATE TABLE _pages_v_blocks_photo_story_images (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _locale text NOT NULL,
    id integer PRIMARY KEY NOT NULL,
    photo text,
    alt text,
    _uuid text,
    FOREIGN KEY (_parent_id) REFERENCES _pages_v_blocks_photo_story(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_images_order_idx ON _pages_v_blocks_photo_story_images (_order);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_images_parent_id_idx ON _pages_v_blocks_photo_story_images (_parent_id);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_images_locale_idx ON _pages_v_blocks_photo_story_images (_locale);`)
  await db.run(sql`CREATE TABLE _pages_v_blocks_photo_story (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _path text NOT NULL,
    _locale text NOT NULL,
    id integer PRIMARY KEY NOT NULL,
    layout text DEFAULT 'editorial',
    appearance_background text DEFAULT 'white',
    appearance_spacing text DEFAULT 'normal',
    appearance_width text DEFAULT 'standard',
    appearance_alignment text DEFAULT 'left',
    appearance_heading_size text DEFAULT 'large',
    appearance_anchor text,
    _uuid text,
    block_name text,
    FOREIGN KEY (_parent_id) REFERENCES _pages_v(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_order_idx ON _pages_v_blocks_photo_story (_order);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_parent_id_idx ON _pages_v_blocks_photo_story (_parent_id);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_path_idx ON _pages_v_blocks_photo_story (_path);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_photo_story_locale_idx ON _pages_v_blocks_photo_story (_locale);`)

  const about = await aboutPage(payload)
  if (!about) return
  await payload.update({ collection: 'pages', id: about.id, locale: 'nl', overrideAccess: true, req, data: { layout: aboutLayout('nl', { photos: false }), _status: 'published' } })
  await payload.update({ collection: 'pages', id: about.id, locale: 'en', overrideAccess: true, req, data: { layout: aboutLayout('en', { photos: false }), _status: 'published' } })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const about = await aboutPage(payload)
  if (about) {
    await payload.update({ collection: 'pages', id: about.id, locale: 'nl', overrideAccess: true, req, data: { layout: aboutLayout('nl', { photos: false }), _status: 'published' } })
    await payload.update({ collection: 'pages', id: about.id, locale: 'en', overrideAccess: true, req, data: { layout: aboutLayout('en', { photos: false }), _status: 'published' } })
  }
  await db.run(sql`DROP TABLE pages_blocks_photo_story_images;`)
  await db.run(sql`DROP TABLE pages_blocks_photo_story;`)
  await db.run(sql`DROP TABLE _pages_v_blocks_photo_story_images;`)
  await db.run(sql`DROP TABLE _pages_v_blocks_photo_story;`)
}
