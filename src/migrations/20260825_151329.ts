import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`intro\` text,
  	\`primary_link_label\` text,
  	\`primary_link_type\` text DEFAULT 'internal',
  	\`primary_link_page_id\` integer,
  	\`primary_link_url\` text,
  	\`primary_link_new_tab\` integer DEFAULT false,
  	\`secondary_link_label\` text,
  	\`secondary_link_type\` text DEFAULT 'internal',
  	\`secondary_link_page_id\` integer,
  	\`secondary_link_url\` text,
  	\`secondary_link_new_tab\` integer DEFAULT false,
  	\`art_style\` text DEFAULT 'none',
  	\`image_id\` integer,
  	\`image_position\` text DEFAULT 'right',
  	\`accent\` text DEFAULT 'yellow',
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`primary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`secondary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_locale_idx\` ON \`pages_blocks_hero\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_primary_link_primary_link_page_idx\` ON \`pages_blocks_hero\` (\`primary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_secondary_link_secondary_link_page_idx\` ON \`pages_blocks_hero\` (\`secondary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_image_idx\` ON \`pages_blocks_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_values_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_values\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_items_order_idx\` ON \`pages_blocks_values_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_items_parent_id_idx\` ON \`pages_blocks_values_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_items_locale_idx\` ON \`pages_blocks_values_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`show_numbers\` integer DEFAULT true,
  	\`appearance_background\` text DEFAULT 'blue',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_order_idx\` ON \`pages_blocks_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_parent_id_idx\` ON \`pages_blocks_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_path_idx\` ON \`pages_blocks_values\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_values_locale_idx\` ON \`pages_blocks_values\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_items_order_idx\` ON \`pages_blocks_content_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_items_parent_id_idx\` ON \`pages_blocks_content_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_items_locale_idx\` ON \`pages_blocks_content_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`layout\` text DEFAULT 'split',
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_locale_idx\` ON \`pages_blocks_content\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_image_idx\` ON \`pages_blocks_content\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_poster\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kicker_left\` text,
  	\`kicker_right\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`small_label\` text,
  	\`title\` text,
  	\`badge\` text,
  	\`accent\` text DEFAULT 'yellow',
  	\`link_label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'blue',
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
  await db.run(sql`CREATE INDEX \`pages_blocks_poster_order_idx\` ON \`pages_blocks_poster\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_poster_parent_id_idx\` ON \`pages_blocks_poster\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_poster_path_idx\` ON \`pages_blocks_poster\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_poster_locale_idx\` ON \`pages_blocks_poster\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_poster_link_link_page_idx\` ON \`pages_blocks_poster\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_events_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'agenda',
  	\`heading\` text,
  	\`intro\` text,
  	\`empty_message\` text,
  	\`limit\` numeric DEFAULT 4,
  	\`selection\` text DEFAULT 'upcoming',
  	\`calendar_link_label\` text,
  	\`calendar_link_type\` text DEFAULT 'internal',
  	\`calendar_link_page_id\` integer,
  	\`calendar_link_url\` text,
  	\`calendar_link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`calendar_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_list_order_idx\` ON \`pages_blocks_events_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_list_parent_id_idx\` ON \`pages_blocks_events_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_list_path_idx\` ON \`pages_blocks_events_list\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_list_locale_idx\` ON \`pages_blocks_events_list\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_list_calendar_link_calendar_link_pag_idx\` ON \`pages_blocks_events_list\` (\`calendar_link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_statement\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`body\` text,
  	\`accent\` text DEFAULT 'pink',
  	\`appearance_background\` text DEFAULT 'pink',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_statement_order_idx\` ON \`pages_blocks_statement\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_statement_parent_id_idx\` ON \`pages_blocks_statement\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_statement_path_idx\` ON \`pages_blocks_statement\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_statement_locale_idx\` ON \`pages_blocks_statement\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`quote\` text,
  	\`body\` text,
  	\`attribution\` text,
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
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_order_idx\` ON \`pages_blocks_quote\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_parent_id_idx\` ON \`pages_blocks_quote\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_path_idx\` ON \`pages_blocks_quote\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_locale_idx\` ON \`pages_blocks_quote\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_call_to_action\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`primary_link_label\` text,
  	\`primary_link_type\` text DEFAULT 'internal',
  	\`primary_link_page_id\` integer,
  	\`primary_link_url\` text,
  	\`primary_link_new_tab\` integer DEFAULT false,
  	\`secondary_link_label\` text,
  	\`secondary_link_type\` text DEFAULT 'internal',
  	\`secondary_link_page_id\` integer,
  	\`secondary_link_url\` text,
  	\`secondary_link_new_tab\` integer DEFAULT false,
  	\`accent\` text DEFAULT 'blue',
  	\`appearance_background\` text DEFAULT 'blue',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`primary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`secondary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_order_idx\` ON \`pages_blocks_call_to_action\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_parent_id_idx\` ON \`pages_blocks_call_to_action\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_path_idx\` ON \`pages_blocks_call_to_action\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_locale_idx\` ON \`pages_blocks_call_to_action\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_primary_link_primary_link_pa_idx\` ON \`pages_blocks_call_to_action\` (\`primary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_secondary_link_secondary_lin_idx\` ON \`pages_blocks_call_to_action\` (\`secondary_link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_media_grid_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_media_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_images_order_idx\` ON \`pages_blocks_media_grid_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_images_parent_id_idx\` ON \`pages_blocks_media_grid_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_images_locale_idx\` ON \`pages_blocks_media_grid_images\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_images_image_idx\` ON \`pages_blocks_media_grid_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_media_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`columns\` text DEFAULT 'mixed',
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
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_order_idx\` ON \`pages_blocks_media_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_parent_id_idx\` ON \`pages_blocks_media_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_path_idx\` ON \`pages_blocks_media_grid\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_grid_locale_idx\` ON \`pages_blocks_media_grid\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`pages_locales\` (
  	\`title\` text,
  	\`slug\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_image_id\` integer,
  	\`seo_no_index\` integer DEFAULT false,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages_locales\` (\`slug\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_seo_seo_image_idx\` ON \`pages_locales\` (\`seo_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_locales_locale_parent_id_unique\` ON \`pages_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`locale\` text,
  	\`events_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_locale_idx\` ON \`pages_rels\` (\`locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_events_id_idx\` ON \`pages_rels\` (\`events_id\`,\`locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`intro\` text,
  	\`primary_link_label\` text,
  	\`primary_link_type\` text DEFAULT 'internal',
  	\`primary_link_page_id\` integer,
  	\`primary_link_url\` text,
  	\`primary_link_new_tab\` integer DEFAULT false,
  	\`secondary_link_label\` text,
  	\`secondary_link_type\` text DEFAULT 'internal',
  	\`secondary_link_page_id\` integer,
  	\`secondary_link_url\` text,
  	\`secondary_link_new_tab\` integer DEFAULT false,
  	\`art_style\` text DEFAULT 'none',
  	\`image_id\` integer,
  	\`image_position\` text DEFAULT 'right',
  	\`accent\` text DEFAULT 'yellow',
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`primary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`secondary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_locale_idx\` ON \`_pages_v_blocks_hero\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_primary_link_primary_link_page_idx\` ON \`_pages_v_blocks_hero\` (\`primary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_secondary_link_secondary_link_page_idx\` ON \`_pages_v_blocks_hero\` (\`secondary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_image_idx\` ON \`_pages_v_blocks_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_values_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_values\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_items_order_idx\` ON \`_pages_v_blocks_values_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_items_parent_id_idx\` ON \`_pages_v_blocks_values_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_items_locale_idx\` ON \`_pages_v_blocks_values_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`show_numbers\` integer DEFAULT true,
  	\`appearance_background\` text DEFAULT 'blue',
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_order_idx\` ON \`_pages_v_blocks_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_parent_id_idx\` ON \`_pages_v_blocks_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_path_idx\` ON \`_pages_v_blocks_values\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_values_locale_idx\` ON \`_pages_v_blocks_values\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_content\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_items_order_idx\` ON \`_pages_v_blocks_content_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_items_parent_id_idx\` ON \`_pages_v_blocks_content_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_items_locale_idx\` ON \`_pages_v_blocks_content_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`layout\` text DEFAULT 'split',
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_locale_idx\` ON \`_pages_v_blocks_content\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_image_idx\` ON \`_pages_v_blocks_content\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_poster\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kicker_left\` text,
  	\`kicker_right\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`small_label\` text,
  	\`title\` text,
  	\`badge\` text,
  	\`accent\` text DEFAULT 'yellow',
  	\`link_label\` text,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'blue',
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_poster_order_idx\` ON \`_pages_v_blocks_poster\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_poster_parent_id_idx\` ON \`_pages_v_blocks_poster\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_poster_path_idx\` ON \`_pages_v_blocks_poster\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_poster_locale_idx\` ON \`_pages_v_blocks_poster\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_poster_link_link_page_idx\` ON \`_pages_v_blocks_poster\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_events_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'agenda',
  	\`heading\` text,
  	\`intro\` text,
  	\`empty_message\` text,
  	\`limit\` numeric DEFAULT 4,
  	\`selection\` text DEFAULT 'upcoming',
  	\`calendar_link_label\` text,
  	\`calendar_link_type\` text DEFAULT 'internal',
  	\`calendar_link_page_id\` integer,
  	\`calendar_link_url\` text,
  	\`calendar_link_new_tab\` integer DEFAULT false,
  	\`appearance_background\` text DEFAULT 'white',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`calendar_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_list_order_idx\` ON \`_pages_v_blocks_events_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_list_parent_id_idx\` ON \`_pages_v_blocks_events_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_list_path_idx\` ON \`_pages_v_blocks_events_list\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_list_locale_idx\` ON \`_pages_v_blocks_events_list\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_list_calendar_link_calendar_link__idx\` ON \`_pages_v_blocks_events_list\` (\`calendar_link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_statement\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`highlight\` text,
  	\`body\` text,
  	\`accent\` text DEFAULT 'pink',
  	\`appearance_background\` text DEFAULT 'pink',
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_statement_order_idx\` ON \`_pages_v_blocks_statement\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_statement_parent_id_idx\` ON \`_pages_v_blocks_statement\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_statement_path_idx\` ON \`_pages_v_blocks_statement\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_statement_locale_idx\` ON \`_pages_v_blocks_statement\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`quote\` text,
  	\`body\` text,
  	\`attribution\` text,
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_order_idx\` ON \`_pages_v_blocks_quote\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_parent_id_idx\` ON \`_pages_v_blocks_quote\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_path_idx\` ON \`_pages_v_blocks_quote\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_locale_idx\` ON \`_pages_v_blocks_quote\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_call_to_action\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`primary_link_label\` text,
  	\`primary_link_type\` text DEFAULT 'internal',
  	\`primary_link_page_id\` integer,
  	\`primary_link_url\` text,
  	\`primary_link_new_tab\` integer DEFAULT false,
  	\`secondary_link_label\` text,
  	\`secondary_link_type\` text DEFAULT 'internal',
  	\`secondary_link_page_id\` integer,
  	\`secondary_link_url\` text,
  	\`secondary_link_new_tab\` integer DEFAULT false,
  	\`accent\` text DEFAULT 'blue',
  	\`appearance_background\` text DEFAULT 'blue',
  	\`appearance_spacing\` text DEFAULT 'normal',
  	\`appearance_width\` text DEFAULT 'standard',
  	\`appearance_alignment\` text DEFAULT 'left',
  	\`appearance_heading_size\` text DEFAULT 'large',
  	\`appearance_anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`primary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`secondary_link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_order_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_parent_id_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_path_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_locale_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_primary_link_primary_link_idx\` ON \`_pages_v_blocks_call_to_action\` (\`primary_link_page_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_secondary_link_secondary__idx\` ON \`_pages_v_blocks_call_to_action\` (\`secondary_link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_media_grid_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_media_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_images_order_idx\` ON \`_pages_v_blocks_media_grid_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_images_parent_id_idx\` ON \`_pages_v_blocks_media_grid_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_images_locale_idx\` ON \`_pages_v_blocks_media_grid_images\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_images_image_idx\` ON \`_pages_v_blocks_media_grid_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_media_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`columns\` text DEFAULT 'mixed',
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_order_idx\` ON \`_pages_v_blocks_media_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_parent_id_idx\` ON \`_pages_v_blocks_media_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_path_idx\` ON \`_pages_v_blocks_media_grid\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_grid_locale_idx\` ON \`_pages_v_blocks_media_grid\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_snapshot_idx\` ON \`_pages_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_published_locale_idx\` ON \`_pages_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_locales\` (
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_image_id\` integer,
  	\`version_seo_no_index\` integer DEFAULT false,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`version_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v_locales\` (\`version_slug\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_seo_version_seo_image_idx\` ON \`_pages_v_locales\` (\`version_seo_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_pages_v_locales_locale_parent_id_unique\` ON \`_pages_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`locale\` text,
  	\`events_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_locale_idx\` ON \`_pages_v_rels\` (\`locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_events_id_idx\` ON \`_pages_v_rels\` (\`events_id\`,\`locale\`);`)
  await db.run(sql`CREATE TABLE \`events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`starts_at\` text,
  	\`ends_at\` text,
  	\`all_day\` integer DEFAULT false,
  	\`event_type\` text DEFAULT 'largeGroup',
  	\`accent\` text DEFAULT 'yellow',
  	\`image_id\` integer,
  	\`registration_url\` text,
  	\`source\` text DEFAULT 'manual',
  	\`external_id\` text,
  	\`external_url\` text,
  	\`last_synced_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`events_starts_at_idx\` ON \`events\` (\`starts_at\`);`)
  await db.run(sql`CREATE INDEX \`events_image_idx\` ON \`events\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`events_external_id_idx\` ON \`events\` (\`external_id\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`events__status_idx\` ON \`events\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`events_locales\` (
  	\`title\` text,
  	\`summary\` text,
  	\`location\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_locales_locale_parent_id_unique\` ON \`events_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_events_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_starts_at\` text,
  	\`version_ends_at\` text,
  	\`version_all_day\` integer DEFAULT false,
  	\`version_event_type\` text DEFAULT 'largeGroup',
  	\`version_accent\` text DEFAULT 'yellow',
  	\`version_image_id\` integer,
  	\`version_registration_url\` text,
  	\`version_source\` text DEFAULT 'manual',
  	\`version_external_id\` text,
  	\`version_external_url\` text,
  	\`version_last_synced_at\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_events_v_parent_idx\` ON \`_events_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version_starts_at_idx\` ON \`_events_v\` (\`version_starts_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version_image_idx\` ON \`_events_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version_external_id_idx\` ON \`_events_v\` (\`version_external_id\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version_updated_at_idx\` ON \`_events_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version_created_at_idx\` ON \`_events_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_version_version__status_idx\` ON \`_events_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_created_at_idx\` ON \`_events_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_updated_at_idx\` ON \`_events_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_snapshot_idx\` ON \`_events_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_published_locale_idx\` ON \`_events_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_events_v_latest_idx\` ON \`_events_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_events_v_locales\` (
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_location\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_events_v_locales_locale_parent_id_unique\` ON \`_events_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`media_locales\` (
  	\`alt\` text NOT NULL,
  	\`caption\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`media_locales_locale_parent_id_unique\` ON \`media_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_jobs_log\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`executed_at\` text NOT NULL,
  	\`completed_at\` text NOT NULL,
  	\`task_slug\` text NOT NULL,
  	\`task_i_d\` text NOT NULL,
  	\`input\` text,
  	\`output\` text,
  	\`state\` text NOT NULL,
  	\`error\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`payload_jobs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_jobs_log_order_idx\` ON \`payload_jobs_log\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_log_parent_id_idx\` ON \`payload_jobs_log\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_jobs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`input\` text,
  	\`completed_at\` text,
  	\`total_tried\` numeric DEFAULT 0,
  	\`has_error\` integer DEFAULT false,
  	\`error\` text,
  	\`task_slug\` text,
  	\`queue\` text DEFAULT 'default',
  	\`wait_until\` text,
  	\`processing\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_jobs_completed_at_idx\` ON \`payload_jobs\` (\`completed_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_total_tried_idx\` ON \`payload_jobs\` (\`total_tried\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_has_error_idx\` ON \`payload_jobs\` (\`has_error\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_task_slug_idx\` ON \`payload_jobs\` (\`task_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_queue_idx\` ON \`payload_jobs\` (\`queue\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_wait_until_idx\` ON \`payload_jobs\` (\`wait_until\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_processing_idx\` ON \`payload_jobs\` (\`processing\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_updated_at_idx\` ON \`payload_jobs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_created_at_idx\` ON \`payload_jobs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_navigation\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_navigation_order_idx\` ON \`site_settings_navigation\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_navigation_parent_id_idx\` ON \`site_settings_navigation\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_navigation_link_link_page_idx\` ON \`site_settings_navigation\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_navigation_locales\` (
  	\`link_label\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings_navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`site_settings_navigation_locales_locale_parent_id_unique\` ON \`site_settings_navigation_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_footer_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'internal',
  	\`link_page_id\` integer,
  	\`link_url\` text,
  	\`link_new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`link_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_footer_links_order_idx\` ON \`site_settings_footer_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_footer_links_parent_id_idx\` ON \`site_settings_footer_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_footer_links_link_link_page_idx\` ON \`site_settings_footer_links\` (\`link_page_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_footer_links_locales\` (
  	\`link_label\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings_footer_links\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`site_settings_footer_links_locales_locale_parent_id_unique\` ON \`site_settings_footer_links_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'Ichtus Leuven' NOT NULL,
  	\`logo_id\` integer,
  	\`footer_logo_id\` integer,
  	\`dutch_label\` text DEFAULT 'nl',
  	\`english_label\` text DEFAULT 'en',
  	\`email\` text,
  	\`instagram_url\` text,
  	\`whatsapp_url\` text,
  	\`facebook_url\` text,
  	\`contact_form_url\` text,
  	\`calendar_url\` text,
  	\`instagram_feed_enabled\` integer DEFAULT false,
  	\`instagram_username\` text,
  	\`default_image_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`footer_logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`default_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_footer_logo_idx\` ON \`site_settings\` (\`footer_logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_default_image_idx\` ON \`site_settings\` (\`default_image_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_locales\` (
  	\`logo_alt\` text DEFAULT 'Ichtus Leuven',
  	\`footer_line\` text,
  	\`default_description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`site_settings_locales_locale_parent_id_unique\` ON \`site_settings_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`pages_id\` integer REFERENCES pages(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`alt\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_values_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_values\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_poster\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_events_list\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_statement\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_call_to_action\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_media_grid_images\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_media_grid\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_values_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_values\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_poster\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_events_list\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_statement\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_call_to_action\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_media_grid_images\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_media_grid\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_locales\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`events_locales\`;`)
  await db.run(sql`DROP TABLE \`_events_v\`;`)
  await db.run(sql`DROP TABLE \`_events_v_locales\`;`)
  await db.run(sql`DROP TABLE \`media_locales\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_jobs_log\`;`)
  await db.run(sql`DROP TABLE \`payload_jobs\`;`)
  await db.run(sql`DROP TABLE \`site_settings_navigation\`;`)
  await db.run(sql`DROP TABLE \`site_settings_navigation_locales\`;`)
  await db.run(sql`DROP TABLE \`site_settings_footer_links\`;`)
  await db.run(sql`DROP TABLE \`site_settings_footer_links_locales\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`site_settings_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`alt\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`name\`;`)
}
