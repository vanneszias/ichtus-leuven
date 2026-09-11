import * as migration_20250929_111647 from './20250929_111647'
import * as migration_20260825_151329 from './20260825_151329'
import * as migration_20260825_161309_frontend_redesign from './20260825_161309_frontend_redesign'
import * as migration_20260825_210721_activity_registrations_about_pages from './20260825_210721_activity_registrations_about_pages'
import * as migration_20260826_104201 from './20260826_104201'
import * as migration_20260826_104958 from './20260826_104958'
import * as migration_20260826_112330 from './20260826_112330'
import * as migration_20260826_155947_localize_link_urls from './20260826_155947_localize_link_urls'
import * as migration_20260827_132835_remove_ai_design_patterns from './20260827_132835_remove_ai_design_patterns'
import * as migration_20260828_134500_registration_production_fixes from './20260828_134500_registration_production_fixes'
import * as migration_20260828_150000_calendar_sync_state from './20260828_150000_calendar_sync_state'
import * as migration_20260829_120000_unify_about_page from './20260829_120000_unify_about_page'
import * as migration_20260829_153000_network_links_schema from './20260829_153000_network_links_schema'
import * as migration_20260829_153500_refine_about_patterns from './20260829_153500_refine_about_patterns'
import * as migration_20260829_160000_about_photos from './20260829_160000_about_photos'
import * as migration_20260829_170000_place_community_photos from './20260829_170000_place_community_photos'
import * as migration_20260829_213000_home_photo_showroom from './20260829_213000_home_photo_showroom'
import * as migration_20260829_220000_expand_home_showroom from './20260829_220000_expand_home_showroom'
import * as migration_20260830_120000_media_semantics from './20260830_120000_media_semantics'
import * as migration_20260831_100000_statement_link from './20260831_100000_statement_link'
import * as migration_20260903_120000_registration_delivery_guards from './20260903_120000_registration_delivery_guards'
import * as migration_20260903_130000_events_empty_link from './20260903_130000_events_empty_link'
import * as migration_20260903_140000_calendar_pagination_contract from './20260903_140000_calendar_pagination_contract'
import * as migration_20260910_120000_retire_orange_accent from './20260910_120000_retire_orange_accent'
import * as migration_20260910_130000_event_detail_pages from './20260910_130000_event_detail_pages'
import * as migration_20260910_140000_activity_type_colour from './20260910_140000_activity_type_colour'
import * as migration_20260911_120000_english_activity_copy from './20260911_120000_english_activity_copy'

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260825_151329.up,
    down: migration_20260825_151329.down,
    name: '20260825_151329',
  },
  {
    up: migration_20260825_161309_frontend_redesign.up,
    down: migration_20260825_161309_frontend_redesign.down,
    name: '20260825_161309_frontend_redesign',
  },
  {
    up: migration_20260825_210721_activity_registrations_about_pages.up,
    down: migration_20260825_210721_activity_registrations_about_pages.down,
    name: '20260825_210721_activity_registrations_about_pages',
  },
  {
    up: migration_20260826_104201.up,
    down: migration_20260826_104201.down,
    name: '20260826_104201',
  },
  {
    up: migration_20260826_104958.up,
    down: migration_20260826_104958.down,
    name: '20260826_104958',
  },
  {
    up: migration_20260826_112330.up,
    down: migration_20260826_112330.down,
    name: '20260826_112330',
  },
  {
    up: migration_20260826_155947_localize_link_urls.up,
    down: migration_20260826_155947_localize_link_urls.down,
    name: '20260826_155947_localize_link_urls',
  },
  {
    up: migration_20260827_132835_remove_ai_design_patterns.up,
    down: migration_20260827_132835_remove_ai_design_patterns.down,
    name: '20260827_132835_remove_ai_design_patterns',
  },
  {
    up: migration_20260828_134500_registration_production_fixes.up,
    down: migration_20260828_134500_registration_production_fixes.down,
    name: '20260828_134500_registration_production_fixes',
  },
  {
    up: migration_20260828_150000_calendar_sync_state.up,
    down: migration_20260828_150000_calendar_sync_state.down,
    name: '20260828_150000_calendar_sync_state',
  },
  {
    up: migration_20260829_120000_unify_about_page.up,
    down: migration_20260829_120000_unify_about_page.down,
    name: '20260829_120000_unify_about_page',
  },
  {
    up: migration_20260829_153000_network_links_schema.up,
    down: migration_20260829_153000_network_links_schema.down,
    name: '20260829_153000_network_links_schema',
  },
  {
    up: migration_20260829_153500_refine_about_patterns.up,
    down: migration_20260829_153500_refine_about_patterns.down,
    name: '20260829_153500_refine_about_patterns',
  },
  {
    up: migration_20260829_160000_about_photos.up,
    down: migration_20260829_160000_about_photos.down,
    name: '20260829_160000_about_photos',
  },
  {
    up: migration_20260829_170000_place_community_photos.up,
    down: migration_20260829_170000_place_community_photos.down,
    name: '20260829_170000_place_community_photos',
  },
  {
    up: migration_20260829_213000_home_photo_showroom.up,
    down: migration_20260829_213000_home_photo_showroom.down,
    name: '20260829_213000_home_photo_showroom',
  },
  {
    up: migration_20260829_220000_expand_home_showroom.up,
    down: migration_20260829_220000_expand_home_showroom.down,
    name: '20260829_220000_expand_home_showroom',
  },
  {
    up: migration_20260830_120000_media_semantics.up,
    down: migration_20260830_120000_media_semantics.down,
    name: '20260830_120000_media_semantics',
  },
  {
    up: migration_20260831_100000_statement_link.up,
    down: migration_20260831_100000_statement_link.down,
    name: '20260831_100000_statement_link',
  },
  {
    up: migration_20260903_120000_registration_delivery_guards.up,
    down: migration_20260903_120000_registration_delivery_guards.down,
    name: '20260903_120000_registration_delivery_guards',
  },
  {
    up: migration_20260903_130000_events_empty_link.up,
    down: migration_20260903_130000_events_empty_link.down,
    name: '20260903_130000_events_empty_link',
  },
  {
    up: migration_20260903_140000_calendar_pagination_contract.up,
    down: migration_20260903_140000_calendar_pagination_contract.down,
    name: '20260903_140000_calendar_pagination_contract',
  },
  {
    up: migration_20260910_120000_retire_orange_accent.up,
    down: migration_20260910_120000_retire_orange_accent.down,
    name: '20260910_120000_retire_orange_accent',
  },
  {
    up: migration_20260910_130000_event_detail_pages.up,
    down: migration_20260910_130000_event_detail_pages.down,
    name: '20260910_130000_event_detail_pages',
  },
  {
    up: migration_20260910_140000_activity_type_colour.up,
    down: migration_20260910_140000_activity_type_colour.down,
    name: '20260910_140000_activity_type_colour',
  },
  {
    up: migration_20260911_120000_english_activity_copy.up,
    down: migration_20260911_120000_english_activity_copy.down,
    name: '20260911_120000_english_activity_copy',
  },
]
