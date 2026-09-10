import 'dotenv/config'

import config from '@payload-config'
import { getPayload } from 'payload'

import { refreshStarterPages } from '@/seed/refresh'
import { assertStarterRefreshAllowed } from '@/seed/safety'

assertStarterRefreshAllowed()
const payload = await getPayload({ config })
await refreshStarterPages(payload)
payload.logger.info('Refreshed local starter page layouts')
process.exit(0)
