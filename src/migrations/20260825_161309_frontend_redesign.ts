import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_info_cards_items\` (
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
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_order_idx\` ON \`pages_blocks_info_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_parent_id_idx\` ON \`pages_blocks_info_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_items_locale_idx\` ON \`pages_blocks_info_cards_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_info_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`intro\` text,
  	\`link_label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'yellow',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_order_idx\` ON \`pages_blocks_info_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_parent_id_idx\` ON \`pages_blocks_info_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_path_idx\` ON \`pages_blocks_info_cards\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_locale_idx\` ON \`pages_blocks_info_cards\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_info_cards_link_link_page_idx\` ON \`pages_blocks_info_cards\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_items_order_idx\` ON \`pages_blocks_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_items_parent_id_idx\` ON \`pages_blocks_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_items_locale_idx\` ON \`pages_blocks_faq_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`intro\` text,
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_order_idx\` ON \`pages_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_parent_id_idx\` ON \`pages_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_path_idx\` ON \`pages_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_locale_idx\` ON \`pages_blocks_faq\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_info_cards_items\` (
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_order_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_parent_id_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_items_locale_idx\` ON \`_pages_v_blocks_info_cards_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_info_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`intro\` text,
  	\`link_label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'yellow',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_order_idx\` ON \`_pages_v_blocks_info_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_parent_id_idx\` ON \`_pages_v_blocks_info_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_path_idx\` ON \`_pages_v_blocks_info_cards\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_locale_idx\` ON \`_pages_v_blocks_info_cards\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_info_cards_link_link_page_idx\` ON \`_pages_v_blocks_info_cards\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_items_order_idx\` ON \`_pages_v_blocks_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_items_parent_id_idx\` ON \`_pages_v_blocks_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_items_locale_idx\` ON \`_pages_v_blocks_faq_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`intro\` text,
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_order_idx\` ON \`_pages_v_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_parent_id_idx\` ON \`_pages_v_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_path_idx\` ON \`_pages_v_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_locale_idx\` ON \`_pages_v_blocks_faq\` (\`_locale\`);`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`instagram_feed_enabled\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`instagram_username\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_info_cards_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_info_cards\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_info_cards_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_info_cards\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`instagram_feed_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`instagram_username\` text;`)
}
