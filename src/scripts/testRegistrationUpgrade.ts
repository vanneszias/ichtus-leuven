import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { MigrateUpArgs } from '@payloadcms/db-d1-sqlite'
import { getPayload } from 'payload'

const statePath = await mkdtemp(path.join(os.tmpdir(), 'ichtus-registration-upgrade-'))
process.env.CLOUDFLARE_PERSIST_PATH = statePath
process.env.CLOUDFLARE_REMOTE = 'false'
process.env.PAYLOAD_DB_PUSH = 'false'
process.env.PAYLOAD_SECRET ||= 'local-upgrade-test-secret-with-32-characters'

try {
  const [{ default: config }, { migrations }] = await Promise.all([
    import('../payload.config'),
    import('../migrations'),
  ])
  const payload = await getPayload({ config })
  const args = { db: payload.db.drizzle, payload, req: { payload } } as MigrateUpArgs
  const productionFixIndex = migrations.findIndex(
    ({ name }) => name === '20260828_134500_registration_production_fixes',
  )
  const guardIndex = migrations.findIndex(
    ({ name }) => name === '20260903_120000_registration_delivery_guards',
  )
  if (productionFixIndex < 1) throw new Error('Registration production migration is missing')
  if (guardIndex <= productionFixIndex)
    throw new Error('Registration lifecycle guard migration is missing')
  for (const migration of migrations.slice(0, productionFixIndex)) await migration.up(args)

  const database = payload.db.drizzle.$client as unknown as D1Database
  const now = new Date().toISOString()
  await database.batch([
    database
      .prepare(
        `INSERT INTO events (id, starts_at, registration_mode, capacity, updated_at, created_at, _status)
      VALUES (1, ?, 'internal', 1.5, ?, ?, 'published')`,
      )
      .bind(now, now, now),
    database
      .prepare(
        `INSERT INTO registrations
      (id, event_id, name, email, locale, status, email_status, email_last_error, active_key, updated_at, created_at)
      VALUES (1, 1, 'Legacy Student', 'legacy@example.com', 'en', 'confirmed', 'failed', 'Legacy provider failure', '1:legacy@example.com', ?, ?)`,
      )
      .bind(now, now),
  ])

  await migrations[productionFixIndex].up(args)
  const delivery = await database
    .prepare(
      `SELECT status, last_error, idempotency_key
    FROM registration_deliveries WHERE registration_id = 1`,
    )
    .first<{
      idempotency_key: string
      last_error: string
      status: string
    }>()
  if (
    delivery?.status !== 'failed' ||
    delivery.last_error !== 'Legacy provider failure' ||
    delivery.idempotency_key !== '1:legacy'
  ) {
    throw new Error(`Legacy Registration Delivery was not preserved: ${JSON.stringify(delivery)}`)
  }
  await migrations[guardIndex].up(args)
  const normalized = await database
    .prepare('SELECT capacity FROM events WHERE id = 1')
    .first<{ capacity: number }>()
  if (normalized?.capacity !== 1)
    throw new Error(`Fractional capacity was not normalized: ${JSON.stringify(normalized)}`)
  let rejectedFraction = false
  try {
    await database.prepare('UPDATE events SET capacity = 1.5 WHERE id = 1').run()
  } catch (error) {
    rejectedFraction = error instanceof Error && error.message.includes('EVENT_CAPACITY_INVALID')
  }
  if (!rejectedFraction) throw new Error('D1 accepted a fractional Event capacity')
  const columns = await database.prepare('PRAGMA table_info(registrations)').all<{ name: string }>()
  for (const legacyColumn of ['confirmation_sent_at', 'email_status', 'email_last_error']) {
    if (!columns.results.some(({ name }) => name === legacyColumn)) {
      throw new Error(`Expand migration removed legacy column ${legacyColumn}`)
    }
  }
} finally {
  const context = await (
    globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<{ dispose?: () => Promise<void> }>
    }
  ).__ichtusCloudflareContext
  await context?.dispose?.()
  await rm(statePath, { recursive: true, force: true })
}
