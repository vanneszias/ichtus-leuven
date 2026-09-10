import type { Endpoint } from 'payload'

import { synchronizeCalendarSource } from '@/lib/calendarSync'
import { requiredSecret } from '@/lib/runtimeConfig'

export const calendarSync: Endpoint = {
  path: '/calendar/sync',
  method: 'post',
  handler: async (req) => {
    let secret: string
    try {
      secret = requiredSecret('CALENDAR_SYNC_SECRET')
    } catch {
      return Response.json({ error: 'Google Calendar is not configured' }, { status: 503 })
    }
    const authorization = req.headers.get('authorization')

    if (authorization !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
