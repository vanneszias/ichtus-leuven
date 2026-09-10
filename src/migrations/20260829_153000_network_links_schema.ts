import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE pages_blocks_network_links_items (
    _order integer NOT NULL,
    _parent_id text NOT NULL,
    _locale text NOT NULL,
    id text PRIMARY KEY NOT NULL,
    name text,
    url text,
    logo text,
    FOREIGN KEY (_parent_id) REFERENCES pages_blocks_network_links(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_items_order_idx ON pages_blocks_network_links_items (_order);`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_items_parent_id_idx ON pages_blocks_network_links_items (_parent_id);`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_items_locale_idx ON pages_blocks_network_links_items (_locale);`)
  await db.run(sql`CREATE TABLE pages_blocks_network_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _path text NOT NULL,
    _locale text NOT NULL,
    id text PRIMARY KEY NOT NULL,
    heading text,
    intro text,
    appearance_background text DEFAULT 'green',
    appearance_spacing text DEFAULT 'normal',
    appearance_width text DEFAULT 'standard',
    appearance_alignment text DEFAULT 'left',
    appearance_heading_size text DEFAULT 'large',
    appearance_anchor text,
    block_name text,
    FOREIGN KEY (_parent_id) REFERENCES pages(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_order_idx ON pages_blocks_network_links (_order);`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_parent_id_idx ON pages_blocks_network_links (_parent_id);`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_path_idx ON pages_blocks_network_links (_path);`)
  await db.run(sql`CREATE INDEX pages_blocks_network_links_locale_idx ON pages_blocks_network_links (_locale);`)
  await db.run(sql`CREATE TABLE _pages_v_blocks_network_links_items (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _locale text NOT NULL,
    id integer PRIMARY KEY NOT NULL,
    name text,
    url text,
    logo text,
    _uuid text,
    FOREIGN KEY (_parent_id) REFERENCES _pages_v_blocks_network_links(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_items_order_idx ON _pages_v_blocks_network_links_items (_order);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_items_parent_id_idx ON _pages_v_blocks_network_links_items (_parent_id);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_items_locale_idx ON _pages_v_blocks_network_links_items (_locale);`)
  await db.run(sql`CREATE TABLE _pages_v_blocks_network_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _path text NOT NULL,
    _locale text NOT NULL,
    id integer PRIMARY KEY NOT NULL,
    heading text,
    intro text,
    appearance_background text DEFAULT 'green',
    appearance_spacing text DEFAULT 'normal',
    appearance_width text DEFAULT 'standard',
    appearance_alignment text DEFAULT 'left',
    appearance_heading_size text DEFAULT 'large',
    appearance_anchor text,
    _uuid text,
    block_name text,
    FOREIGN KEY (_parent_id) REFERENCES _pages_v(id) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_order_idx ON _pages_v_blocks_network_links (_order);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_parent_id_idx ON _pages_v_blocks_network_links (_parent_id);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_path_idx ON _pages_v_blocks_network_links (_path);`)
  await db.run(sql`CREATE INDEX _pages_v_blocks_network_links_locale_idx ON _pages_v_blocks_network_links (_locale);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE pages_blocks_network_links_items;`)
  await db.run(sql`DROP TABLE pages_blocks_network_links;`)
  await db.run(sql`DROP TABLE _pages_v_blocks_network_links_items;`)
  await db.run(sql`DROP TABLE _pages_v_blocks_network_links;`)
}
