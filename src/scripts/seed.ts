import 'dotenv/config'

import config from '@payload-config'
import { getPayload } from 'payload'

import { assertRemoteEmptySeedAllowed } from '@/seed/safety'
import { applyStarterContent } from '@/seed/starterContent'

async function seed() {
  const payload = await getPayload({ config })
  const [pages, initialSettings] = await Promise.all([
    payload.count({ collection: 'pages', overrideAccess: true }),
    payload.findGlobal({ slug: 'site-settings', locale: 'nl', overrideAccess: true }),
  ])
  const settingsPopulated = Boolean(
    initialSettings.navigation?.length ||
      initialSettings.footerLinks?.length ||
      initialSettings.email ||
      initialSettings.instagramUrl,
  )
  try {
    assertRemoteEmptySeedAllowed({
      environment: process.env.CLOUDFLARE_ENV,
      pageCount: pages.totalDocs,
      remote: process.env.CLOUDFLARE_REMOTE === 'true',
      settingsPopulated,
      confirmation: process.env.SEED_EMPTY_DATABASE,
    })
  } catch (error) {
    if (process.env.CLOUDFLARE_REMOTE !== 'true' && (pages.totalDocs > 0 || settingsPopulated)) {
      payload.logger.info('Starter content already exists; seed made no changes')
      return
    }
    throw error
  }

  const { eventIDs, media, pageIDs } = await applyStarterContent(payload)
  payload.logger.info(
    `Seeded ${Object.keys(pageIDs).length} page slugs, ${Object.keys(media).length} media files and ${eventIDs.length} activities`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
