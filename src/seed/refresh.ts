import type { Payload, PayloadRequest } from 'payload'

import { assertStarterRefreshAllowed } from '@/seed/safety'
import { applyStarterContent } from '@/seed/starterContent'

/**
 * Overwrites the local editorial content with the generated starter content.
 * Use `pnpm pull:staging` to refresh that content from Cloudflare first.
 */
export async function refreshStarterPages(payload: Payload, req?: PayloadRequest) {
  assertStarterRefreshAllowed()
  await applyStarterContent(payload, req)
}
