import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access'
import { synchronizeCalendarSource } from '@/lib/calendarSync'
import { requiredSecret } from '@/lib/runtimeConfig'

function host(value: string | null | undefined) {
  if (!value) return undefined
  try {
    return new URL(value).host
  } catch {
    return undefined
  }
}

/**
 * The session path is authenticated by cookie, so it carries its own CSRF
 * guard. Comparing the Origin against the host the request actually arrived on
 * keeps the admin panel working on every hostname it is served from — custom
 * domain, workers.dev or localhost — which comparing against the public site
 * URL would not. Browsers always send Origin on a cross-site POST, so a request
 * without one is never a form another site could have submitted.
 */
function sameOrigin(req: PayloadRequest) {
  const origin = host(req.headers.get('origin'))
  return Boolean(origin) && origin === (req.headers.get('host') || host(req.url))
}

/**
 * Two callers are allowed in. The scheduler presents the shared secret, which
 * only ever lives in the Worker. An activity manager triggering the same run by
 * hand from the admin panel presents their own session instead, so the secret
 * never has to reach a browser; the origin check keeps that cookie-backed path
 * from being driven by another site.
 */
function authorize(req: PayloadRequest): Response | undefined {
  const authorization = req.headers.get('authorization')

  if (authorization) {
    let secret: string
    try {
      secret = requiredSecret('CALENDAR_SYNC_SECRET')
    } catch {
      return Response.json({ error: 'Google Calendar is not configured' }, { status: 503 })
    }
    if (authorization !== `Bearer ${secret}`)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    return undefined
  }

  // Mirrors the Activiteiten write roles, because a synchronisation run creates
  // and updates those same documents.
  if (!hasRole(req.user, ['admin', 'editor', 'registrationManager']) || !sameOrigin(req))
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return undefined
}

export const calendarSync: Endpoint = {
  path: '/calendar/sync',
  method: 'post',
  handler: async (req) => {
    const rejection = authorize(req)
    if (rejection) return rejection

    try {
      return Response.json(await synchronizeCalendarSource(req.payload))
    } catch (error) {
      req.payload.logger.error(
        { errorName: error instanceof Error ? error.name : 'UnknownError' },
        'Calendar Source synchronization failed',
      )
      return Response.json({ error: 'Google Calendar request failed' }, { status: 502 })
    }
  },
}
