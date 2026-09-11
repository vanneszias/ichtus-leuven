import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { calendarSync } from '../../src/endpoints/calendarSync'

const SECRET = 'calendar-sync-secret-with-32-characters'

/**
 * Only the authorization branches are under test, so the payload stub carries
 * just the logger the failure path reaches for. A run that gets past the guard
 * fails on the absent Google credentials, which is how these cases tell
 * "authorized" apart from "rejected" without touching the network.
 */
type Caller = { authorization?: string; origin?: string | null; role?: string }

function request(init: Caller): PayloadRequest {
  const headers = new Headers({ host: 'admin.example.org' })
  if (init.authorization) headers.set('authorization', init.authorization)
  // The admin panel is same-origin with the API, which the default stands for.
  // A case passes `origin: null` to drop the header entirely.
  const origin = init.origin === undefined ? 'https://admin.example.org' : init.origin
  if (origin) headers.set('origin', origin)
  return {
    headers,
    payload: { logger: { error: () => {} } },
    url: 'https://admin.example.org/api/calendar/sync',
    user: init.role ? { role: init.role } : null,
  } as unknown as PayloadRequest
}

const run = (init: Caller) => calendarSync.handler(request(init)) as Promise<Response>

describe('calendar sync endpoint authorization', () => {
  // Tests share a process, so the Google credentials are cleared per case to
  // keep an authorized run failing locally instead of reaching the network,
  // then restored so no other spec observes the gap.
  const GUARDED = ['CALENDAR_SYNC_SECRET', 'GOOGLE_CALENDAR_API_KEY', 'GOOGLE_CALENDAR_ID']
  let saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    saved = Object.fromEntries(GUARDED.map((name) => [name, process.env[name]]))
    for (const name of GUARDED) delete process.env[name]
  })

  afterEach(() => {
    for (const name of GUARDED) {
      if (saved[name] === undefined) delete process.env[name]
      else process.env[name] = saved[name]
    }
  })

  it('rejects an anonymous request that carries no credentials at all', async () => {
    expect((await run({})).status).toBe(401)
  })

  it('rejects a bearer token that does not match the configured secret', async () => {
    process.env.CALENDAR_SYNC_SECRET = SECRET
    expect((await run({ authorization: 'Bearer wrong' })).status).toBe(401)
  })

  it('reports missing configuration to the scheduler rather than a rejection', async () => {
    expect((await run({ authorization: `Bearer ${SECRET}` })).status).toBe(503)
  })

  it('rejects a signed-in user whose role cannot manage activities', async () => {
    expect((await run({ role: 'subscriber' })).status).toBe(401)
  })

  it('rejects a session request submitted from another site', async () => {
    expect((await run({ origin: 'https://attacker.example', role: 'admin' })).status).toBe(401)
  })

  it('rejects a session request that carries no Origin at all', async () => {
    expect((await run({ origin: null, role: 'admin' })).status).toBe(401)
  })

  it('lets an activity manager through on their session alone', async () => {
    // 502 is the Google call failing, which only happens after the guard passes.
    expect((await run({ role: 'editor' })).status).toBe(502)
  })

  it('does not require the shared secret for the admin panel path', async () => {
    expect((await run({ role: 'admin' })).status).not.toBe(401)
  })
})
