import type { Payload } from 'payload'

import { prepareRegistrationDelivery } from '@/lib/registrationDeliveries'
import { createCancellationToken, hashToken, normalizeEmail } from '@/lib/registrationSecurity'
import type { Event, Registration } from '@/payload-types'

export class RegistrationError extends Error {
  constructor(
    public code: 'closed' | 'duplicate' | 'full' | 'notFound',
    message: string,
  ) {
    super(message)
  }
}

const MAX_MAINTENANCE_BATCH = 100

function d1(payload: Payload) {
  return payload.db.drizzle.$client as unknown as D1Database
}

function boundedLimit(limit: number) {
  return Math.min(Math.max(Math.trunc(limit) || 1, 1), MAX_MAINTENANCE_BATCH)
}

function isUniqueError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  return message.includes('UNIQUE') || message.includes('unique')
}

export function registrationAvailability(event: Event, now = new Date()) {
  if (event._status !== 'published' || event.registrationMode !== 'internal')
    return 'closed' as const
  if (event.registrationClosurePendingAt) return 'closed' as const
  if (event.registrationOpensAt && new Date(event.registrationOpensAt) > now)
    return 'notOpen' as const
  if (event.registrationDeadline && new Date(event.registrationDeadline) < now)
    return 'closed' as const
  if (new Date(event.startsAt) < now) return 'closed' as const
  return 'open' as const
}

export async function createRegistration(
  payload: Payload,
  event: Event,
  input: { email: string; locale: 'nl' | 'en'; name: string },
) {
  if (registrationAvailability(event) !== 'open')
    throw new RegistrationError('closed', 'Registration is closed')
  const email = normalizeEmail(input.email)
  const activeKey = `${event.id}:${email}`
  const token = createCancellationToken()
  const tokenHash = await hashToken(token)
  const prepared = await prepareRegistrationDelivery('new', {
    type: 'signup',
    status: 'confirmed',
    token,
  })
  const now = new Date().toISOString()
  const database = d1(payload)

  try {
    const results = await database.batch([
      database
        .prepare(
          `
        INSERT INTO registrations (event_id, name, email, locale, status, active_key, cancellation_token_hash, updated_at, created_at)
        SELECT e.id, ?, ?, ?,
          CASE WHEN e.capacity IS NULL OR (
            SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed'
          ) < CAST(e.capacity AS INTEGER) THEN 'confirmed' ELSE 'waitlisted' END,
          ?, ?, ?, ?
        FROM events e
        WHERE e.id = ? AND e._status = 'published' AND e.registration_mode = 'internal'
          AND e.registration_closure_pending_at IS NULL
          AND (e.registration_opens_at IS NULL OR e.registration_opens_at <= ?)
          AND (e.registration_deadline IS NULL OR e.registration_deadline >= ?)
          AND e.starts_at >= ? AND (
          e.waitlist_enabled = 1 OR e.capacity IS NULL OR (
            SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed'
          ) < CAST(e.capacity AS INTEGER)
        )
      `,
        )
        .bind(
          input.name.trim(),
          email,
          input.locale,
          activeKey,
          tokenHash,
          now,
          now,
          event.id,
          now,
          now,
          now,
        ),
      database
        .prepare(
          `
        INSERT INTO registration_deliveries
          (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
        SELECT r.id, r.event_id, CASE WHEN r.status = 'confirmed' THEN 'confirmed' ELSE 'waitlisted' END,
          'pending', 0, ?, CAST(r.id AS TEXT) || ':signup', ?, ?, ?
        FROM registrations r WHERE r.active_key = ?
      `,
        )
        .bind(now, prepared.encryptedPayload, now, now, activeKey),
    ])
    if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
      const currentEvent = await payload.findByID({
        collection: 'events',
        id: event.id,
        overrideAccess: true,
      })
      if (registrationAvailability(currentEvent) !== 'open')
        throw new RegistrationError('closed', 'Registration is closed')
      throw new RegistrationError('full', 'Activity is full')
    }
  } catch (error) {
    if (isUniqueError(error))
      throw new RegistrationError('duplicate', 'An active registration already exists')
    if (error instanceof RegistrationError) throw error
    if (error instanceof Error && error.message.includes('REGISTRATION_CAPACITY_REACHED')) {
      throw new RegistrationError('full', 'Activity is full')
    }
    throw error
  }

  const result = await payload.find({
    collection: 'registrations',
    overrideAccess: true,
    limit: 1,
    where: { activeKey: { equals: activeKey } },
  })
  if (!result.docs[0]) throw new Error('Committed registration could not be read')
  return result.docs[0]
}

export async function promoteWaitlisted(payload: Payload, event: Event) {
  const token = createCancellationToken()
  const tokenHash = await hashToken(token)
  const prepared = await prepareRegistrationDelivery('waiting', { type: 'promotion', token })
  const now = new Date().toISOString()
  const database = d1(payload)
  try {
    const results = await database.batch([
      database
        .prepare(
          `
        UPDATE registrations SET status = 'confirmed', cancellation_token_hash = ?, updated_at = ?
        WHERE id = (
          SELECT id FROM registrations
          WHERE event_id = ? AND status = 'waitlisted'
          ORDER BY created_at, id LIMIT 1
        ) AND EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = ? AND e._status = 'published' AND e.registration_mode = 'internal'
            AND e.registration_closure_pending_at IS NULL
            AND (e.registration_opens_at IS NULL OR e.registration_opens_at <= ?)
            AND (e.registration_deadline IS NULL OR e.registration_deadline >= ?)
            AND e.starts_at >= ?
        )
      `,
        )
        .bind(tokenHash, now, event.id, event.id, now, now, now),
      database
        .prepare(
          `
        INSERT INTO registration_deliveries
          (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
        SELECT r.id, r.event_id, 'promoted', 'pending', 0, ?, CAST(r.id AS TEXT) || ':promotion', ?, ?, ?
        FROM registrations r WHERE r.cancellation_token_hash = ? AND r.status = 'confirmed'
      `,
        )
        .bind(now, prepared.encryptedPayload, now, now, tokenHash),
    ])
    if (results[0].meta.changes !== 1) return null
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('REGISTRATION_CAPACITY_REACHED') || isUniqueError(error))
    )
      return null
    throw error
  }
  const promoted = await payload.find({
    collection: 'registrations',
    overrideAccess: true,
    limit: 1,
    where: { cancellationTokenHash: { equals: tokenHash } },
  })
  return promoted.docs[0] ?? null
}

export async function cancelRegistration(payload: Payload, token: string) {
  const cancellationTokenHash = await hashToken(token)
  const found = await payload.find({
    collection: 'registrations',
    overrideAccess: true,
    depth: 1,
    limit: 1,
    showHiddenFields: true,
    where: { cancellationTokenHash: { equals: cancellationTokenHash } },
  })
  const registration = found.docs[0]
  if (!registration || registration.status === 'anonymized')
    throw new RegistrationError('notFound', 'Registration not found')
  if (registration.status === 'cancelled') return registration
  const event =
    typeof registration.event === 'object'
      ? registration.event
      : await payload.findByID({
          collection: 'events',
          id: registration.event,
          overrideAccess: true,
        })
  const transitionID = crypto.randomUUID()
  const cancelledAt = new Date().toISOString()
  const cancellation = await prepareRegistrationDelivery(registration.id, {
    type: 'cancellation',
    transitionID,
  })
  const promotionToken = createCancellationToken()
  const promotionTokenHash = await hashToken(promotionToken)
  const promotion = await prepareRegistrationDelivery('waiting', {
    type: 'promotion',
    token: promotionToken,
  })
  const database = d1(payload)

  const results = await database.batch([
    database
      .prepare(
        `
      UPDATE registrations SET active_key = NULL, cancelled_at = ?, lifecycle_transition_id = ?, status = 'cancelled', updated_at = ?
      WHERE id = ? AND cancellation_token_hash = ? AND status = ?
    `,
      )
      .bind(
        cancelledAt,
        transitionID,
        cancelledAt,
        registration.id,
        cancellationTokenHash,
        registration.status,
      ),
    database
      .prepare(
        `
      INSERT INTO registration_deliveries
        (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
      SELECT r.id, r.event_id, 'cancelled', 'pending', 0, ?, ?, NULL, ?, ?
      FROM registrations r WHERE r.id = ? AND r.lifecycle_transition_id = ?
    `,
      )
      .bind(
        cancelledAt,
        cancellation.idempotencyKey,
        cancelledAt,
        cancelledAt,
        registration.id,
        transitionID,
      ),
    database
      .prepare(
        `
      UPDATE registrations SET status = 'confirmed', cancellation_token_hash = ?, updated_at = ?
      WHERE ? = 'confirmed' AND EXISTS (
        SELECT 1 FROM registrations cancelled WHERE cancelled.id = ? AND cancelled.lifecycle_transition_id = ?
      ) AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = ? AND e._status = 'published' AND e.registration_mode = 'internal'
          AND e.registration_closure_pending_at IS NULL
          AND (e.registration_opens_at IS NULL OR e.registration_opens_at <= ?)
          AND (e.registration_deadline IS NULL OR e.registration_deadline >= ?)
          AND e.starts_at >= ?
      ) AND id = (
        SELECT id FROM registrations WHERE event_id = ? AND status = 'waitlisted' ORDER BY created_at, id LIMIT 1
      )
    `,
      )
      .bind(
        promotionTokenHash,
        cancelledAt,
        registration.status,
        registration.id,
        transitionID,
        event.id,
        cancelledAt,
        cancelledAt,
        cancelledAt,
        event.id,
      ),
    database
      .prepare(
        `
      INSERT INTO registration_deliveries
        (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
      SELECT r.id, r.event_id, 'promoted', 'pending', 0, ?, CAST(r.id AS TEXT) || ':promotion', ?, ?, ?
      FROM registrations r WHERE r.cancellation_token_hash = ? AND r.status = 'confirmed'
    `,
      )
      .bind(cancelledAt, promotion.encryptedPayload, cancelledAt, cancelledAt, promotionTokenHash),
  ])
  if (results[0].meta.changes !== 1) {
    const current = await payload.findByID({
      collection: 'registrations',
      id: registration.id,
      overrideAccess: true,
    })
    if (current.status === 'cancelled') return current
    throw new RegistrationError('notFound', 'Registration not found')
  }
  return payload.findByID({
    collection: 'registrations',
    id: registration.id,
    overrideAccess: true,
  })
}

export async function resendRegistration(
  payload: Payload,
  registration: Registration,
  event: Event,
) {
  const active = registration.status === 'confirmed' || registration.status === 'waitlisted'
  const token = active ? createCancellationToken() : undefined
  const tokenHash = token ? await hashToken(token) : null
  const kind =
    registration.status === 'waitlisted'
      ? 'waitlisted'
      : registration.status === 'cancelled'
        ? 'cancelled'
        : 'confirmed'
  const prepared = await prepareRegistrationDelivery(registration.id, {
    type: 'resend',
    kind,
    token,
    transitionID: crypto.randomUUID(),
  })
  const now = new Date().toISOString()
  const database = d1(payload)
  const statements = []
  if (tokenHash) {
    statements.push(
      database
        .prepare(
          "UPDATE registrations SET cancellation_token_hash = ?, updated_at = ? WHERE id = ? AND status IN ('confirmed', 'waitlisted')",
        )
        .bind(tokenHash, now, registration.id),
    )
  }
  statements.push(
    database
      .prepare(
        `
    INSERT INTO registration_deliveries
      (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
    VALUES (?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?)
  `,
      )
      .bind(
        registration.id,
        event.id,
        prepared.kind,
        now,
        prepared.idempotencyKey,
        prepared.encryptedPayload,
        now,
        now,
      ),
  )
  await database.batch(statements)
}

export async function processEventRegistrationClosures(payload: Payload, limit = 25) {
  const maximum = boundedLimit(limit)
  const events = await payload.find({
    collection: 'events',
    overrideAccess: true,
    depth: 0,
    limit: maximum,
    sort: 'registrationClosurePendingAt',
    where: { registrationClosurePendingAt: { exists: true } },
  })
  let processed = 0
  let completedEvents = 0
  for (const event of events.docs) {
    if (processed >= maximum || !event.registrationClosurePendingAt) break
    const active = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      depth: 0,
      limit: maximum - processed,
      sort: 'createdAt',
      where: {
        and: [{ event: { equals: event.id } }, { status: { in: ['confirmed', 'waitlisted'] } }],
      },
    })
    for (const registration of active.docs) {
      const transitionID = event.registrationClosurePendingAt
      const closureKind =
        event.registrationClosureReason === 'upstreamCancelled'
          ? 'eventCancelled'
          : event.registrationClosureReason === 'modeChanged'
            ? 'registrationChanged'
            : 'registrationClosed'
      const prepared = await prepareRegistrationDelivery(registration.id, {
        type: 'eventClosure',
        kind: closureKind,
        transitionID,
      })
      const now = new Date().toISOString()
      const database = d1(payload)
      await database.batch([
        database
          .prepare(
            `
          UPDATE registrations SET active_key = NULL, cancellation_token_hash = NULL, cancelled_at = ?, lifecycle_transition_id = ?, status = 'cancelled', updated_at = ?
          WHERE id = ? AND status IN ('confirmed', 'waitlisted')
        `,
          )
          .bind(now, transitionID, now, registration.id),
        database
          .prepare(
            `
          INSERT OR IGNORE INTO registration_deliveries
            (registration_id, event_id, kind, status, attempts, next_attempt_at, idempotency_key, encrypted_payload, updated_at, created_at)
          SELECT r.id, r.event_id, ?, 'pending', 0, ?, ?, NULL, ?, ?
          FROM registrations r WHERE r.id = ? AND r.status = 'cancelled' AND r.lifecycle_transition_id = ?
        `,
          )
          .bind(
            prepared.kind,
            now,
            prepared.idempotencyKey,
            now,
            now,
            registration.id,
            transitionID,
          ),
      ])
      processed += 1
    }
    const remaining = await payload.count({
      collection: 'registrations',
      overrideAccess: true,
      where: {
        and: [{ event: { equals: event.id } }, { status: { in: ['confirmed', 'waitlisted'] } }],
      },
    })
    if (remaining.totalDocs === 0) {
      const cleared = await d1(payload)
        .prepare(
          `
        UPDATE events SET registration_closure_pending_at = NULL, registration_closure_reason = NULL, updated_at = ?
        WHERE id = ? AND registration_closure_pending_at = ? AND NOT EXISTS (
          SELECT 1 FROM registrations
          WHERE event_id = events.id AND status IN ('confirmed', 'waitlisted')
        )
      `,
        )
        .bind(new Date().toISOString(), event.id, event.registrationClosurePendingAt)
        .run()
      if (cleared.meta.changes === 1) completedEvents += 1
    }
  }
  const pending = await payload.count({
    collection: 'events',
    overrideAccess: true,
    where: { registrationClosurePendingAt: { exists: true } },
  })
  return { completedEvents, hasMore: pending.totalDocs > 0, processed }
}

export async function anonymizeOldRegistrations(payload: Payload, limit = 25) {
  const maximum = boundedLimit(limit)
  const cutoff = new Date()
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1)
  const rows = await d1(payload)
    .prepare(
      `
    SELECT r.id FROM registrations r
    INNER JOIN events e ON e.id = r.event_id
    WHERE e.starts_at < ? AND r.status != 'anonymized' AND NOT EXISTS (
      SELECT 1 FROM registration_deliveries d
      WHERE d.registration_id = r.id AND d.status = 'processing'
    )
    ORDER BY e.starts_at, r.id LIMIT ?
  `,
    )
    .bind(cutoff.toISOString(), maximum)
    .all<{ id: number }>()
  const now = new Date().toISOString()
  let anonymized = 0
  for (const row of rows.results) {
    const database = d1(payload)
    const results = await database.batch([
      database
        .prepare(
          `
        UPDATE registrations SET active_key = NULL, admin_notes = NULL, cancellation_token_hash = NULL, email_last_error = NULL,
          email = ?, lifecycle_transition_id = NULL, name = 'Anonymized', status = 'anonymized', updated_at = ?
        WHERE id = ? AND status != 'anonymized' AND NOT EXISTS (
          SELECT 1 FROM registration_deliveries d
          WHERE d.registration_id = registrations.id AND d.status = 'processing'
        )
      `,
        )
        .bind(`anonymized-${row.id}@invalid.local`, now, row.id),
      database
        .prepare(
          `
        UPDATE registration_deliveries
        SET encrypted_payload = NULL, last_error = NULL, locked_at = NULL, lock_token = NULL,
            next_attempt_at = NULL, status = CASE WHEN status = 'sent' THEN 'sent' ELSE 'failed' END, updated_at = ?
        WHERE registration_id = ? AND EXISTS (
          SELECT 1 FROM registrations r
          WHERE r.id = registration_deliveries.registration_id AND r.status = 'anonymized'
        )
      `,
        )
        .bind(now, row.id),
    ])
    if (results[0].meta.changes === 1) anonymized += 1
  }
  const remaining = await d1(payload)
    .prepare(
      `
    SELECT
      EXISTS (
        SELECT 1 FROM registrations r INNER JOIN events e ON e.id = r.event_id
        WHERE e.starts_at < ? AND r.status != 'anonymized' AND NOT EXISTS (
          SELECT 1 FROM registration_deliveries d
          WHERE d.registration_id = r.id AND d.status = 'processing'
        )
      ) AS has_more,
      EXISTS (
        SELECT 1 FROM registrations r INNER JOIN events e ON e.id = r.event_id
        WHERE e.starts_at < ? AND r.status != 'anonymized' AND EXISTS (
          SELECT 1 FROM registration_deliveries d
          WHERE d.registration_id = r.id AND d.status = 'processing'
        )
      ) AS deferred
  `,
    )
    .bind(cutoff.toISOString(), cutoff.toISOString())
    .first<{ deferred: number; has_more: number }>()
  return {
    anonymized,
    deferred: Boolean(remaining?.deferred),
    hasMore: Boolean(remaining?.has_more),
  }
}
