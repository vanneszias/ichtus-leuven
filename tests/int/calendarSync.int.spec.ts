import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { synchronizeCalendarSource } from '../../src/lib/calendarSync'
import config from '../../src/payload.config'

describe('Calendar Source synchronization', () => {
  let payload: Payload
  const externalIDs = ['calendar-cancelled-test', 'calendar-created-test']

  beforeAll(async () => {
    process.env.GOOGLE_CALENDAR_ID = 'calendar@example.org'
    process.env.GOOGLE_CALENDAR_API_KEY = 'test-calendar-key'
    payload = await getPayload({ config })
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database
      .prepare(
        `CREATE TABLE IF NOT EXISTS calendar_sync_state (
      source text PRIMARY KEY NOT NULL,
      page_token text,
      sync_token text,
      updated_at text NOT NULL,
      time_min text
    )`,
      )
      .run()
    await database.prepare("DELETE FROM calendar_sync_state WHERE source = 'google'").run()
    const existing = await payload.find({
      collection: 'events',
      overrideAccess: true,
      pagination: false,
      where: { externalId: { in: externalIDs } },
    })
    for (const event of existing.docs) {
      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    }
  })

  afterAll(async () => {
    const existing = await payload.find({
      collection: 'events',
      overrideAccess: true,
      pagination: false,
      where: { externalId: { in: externalIDs } },
    })
    for (const event of existing.docs) {
      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    }
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database.prepare("DELETE FROM calendar_sync_state WHERE source = 'google'").run()
  })

  it('processes one page and closes an Event from a sparse cancellation record', async () => {
    const event = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: 'Calendar cancellation test',
        externalId: externalIDs[0],
        source: 'google',
        startsAt: new Date(Date.now() + 86_400_000).toISOString(),
        registrationMode: 'internal',
        _status: 'published',
      },
    })
    let requestedURL = ''
    const result = await synchronizeCalendarSource(payload, async (input) => {
      requestedURL = String(input)
      return Response.json({
        items: [{ id: externalIDs[0], status: 'cancelled' }],
        nextPageToken: 'next-page',
      })
    })

    expect(requestedURL).toContain('showDeleted=true')
    expect(requestedURL).toContain('maxResults=50')
    expect(requestedURL).toContain('orderBy=startTime')
    expect(requestedURL).toContain('timeMin=')
    expect(result).toMatchObject({ hasMore: true, synced: 1 })
    const closed = await payload.findByID({
      collection: 'events',
      id: event.id,
      overrideAccess: true,
    })
    expect(closed._status).toBe('draft')
    expect(closed.registrationClosurePendingAt).toBeTruthy()
    expect(closed.registrationClosureReason).toBe('upstreamCancelled')
  })

  it('resumes the saved page and commits the incremental sync token', async () => {
    let requestedURL = ''
    const result = await synchronizeCalendarSource(payload, async (input) => {
      requestedURL = String(input)
      return Response.json({
        items: [
          {
            id: externalIDs[1],
            summary: 'WILD calendar test',
            description: '<p>Safe <strong>summary</strong></p>',
            start: { dateTime: new Date(Date.now() + 172_800_000).toISOString() },
            end: { dateTime: new Date(Date.now() + 176_400_000).toISOString() },
          },
        ],
        nextSyncToken: 'incremental-token',
      })
    })

    expect(requestedURL).toContain('pageToken=next-page')
    expect(requestedURL).toContain('orderBy=startTime')
    expect(requestedURL).toContain('timeMin=')
    expect(result).toMatchObject({ hasMore: false, synced: 1 })
    const created = await payload.find({
      collection: 'events',
      limit: 1,
      overrideAccess: true,
      where: { externalId: { equals: externalIDs[1] } },
    })
    expect(created.docs[0]).toMatchObject({
      eventType: 'wild',
      summary: 'Safe summary',
    })
    await payload.update({
      collection: 'events',
      id: created.docs[0].id,
      overrideAccess: true,
      data: {
        _status: 'draft',
        eventType: 'other',
        summary: 'Editorial summary',
      },
    })

    let incrementalURL = ''
    await synchronizeCalendarSource(payload, async (input) => {
      incrementalURL = String(input)
      return Response.json({
        items: [
          {
            id: externalIDs[1],
            summary: 'Renamed calendar event',
            description: 'Changed source description',
            start: { dateTime: new Date(Date.now() + 172_800_000).toISOString() },
          },
        ],
        nextSyncToken: 'incremental-token-2',
      })
    })
    expect(incrementalURL).toContain('syncToken=incremental-token')
    expect(incrementalURL).not.toContain('timeMin=')
    const updated = await payload.findByID({
      collection: 'events',
      id: created.docs[0].id,
      overrideAccess: true,
    })
    expect(updated).toMatchObject({
      _status: 'draft',
      eventType: 'other',
      summary: 'Editorial summary',
      title: 'Renamed calendar event',
    })
  })

  it('resets an expired incremental token without losing Event data', async () => {
    const result = await synchronizeCalendarSource(
      payload,
      async () => new Response(null, { status: 410 }),
    )
    expect(result).toEqual({ reset: true, hasMore: true, synced: 0, skipped: 0 })
  })
})
