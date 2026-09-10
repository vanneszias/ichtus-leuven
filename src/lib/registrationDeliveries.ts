import type { Payload } from 'payload'
import { type RegistrationEmailKind, sendRegistrationEmail } from '@/lib/registrationEmail'
import {
  decryptDeliveryPayload,
  encryptDeliveryPayload,
  hashToken,
} from '@/lib/registrationSecurity'
import type { Event, Registration, RegistrationDelivery } from '@/payload-types'

const MAX_ATTEMPTS = 8
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000
const SUPERSEDED_ERROR = 'Delivery intent superseded by a later registration transition'
const UNKNOWN_OUTCOME_ERROR =
  'Delivery outcome unknown after processing lease expired; administrator resend required'

export type RegistrationDeliveryIntent =
  | { type: 'signup'; status: 'confirmed' | 'waitlisted'; token: string }
  | { type: 'promotion'; token: string }
  | { type: 'cancellation'; transitionID: string }
  | {
      type: 'eventClosure'
      kind: 'eventCancelled' | 'registrationClosed' | 'registrationChanged'
      transitionID: string
    }
  | {
      type: 'resend'
      kind: Exclude<
        RegistrationEmailKind,
        'eventCancelled' | 'registrationClosed' | 'registrationChanged' | 'promoted'
      >
      token?: string
      transitionID: string
    }

export type PreparedRegistrationDelivery = {
  encryptedPayload: string | null
  idempotencyKey: string
  kind: RegistrationEmailKind
}

function d1(payload: Payload) {
  return payload.db.drizzle.$client as unknown as D1Database
}

function retryAt(attempts: number) {
  const delayMinutes = Math.min(24 * 60, 2 ** Math.max(0, attempts - 1) * 5)
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
}

function safeErrorMessage(error: unknown) {
  const name = error instanceof Error ? error.name : 'UnknownError'
  return `Email provider failed (${name})`
}

export async function prepareRegistrationDelivery(
  registrationID: number | string,
  intent: RegistrationDeliveryIntent,
): Promise<PreparedRegistrationDelivery> {
  switch (intent.type) {
    case 'signup':
      return {
        encryptedPayload: await encryptDeliveryPayload({ token: intent.token }),
        idempotencyKey: `${registrationID}:signup`,
        kind: intent.status,
      }
    case 'promotion':
      return {
        encryptedPayload: await encryptDeliveryPayload({ token: intent.token }),
        idempotencyKey: `${registrationID}:promotion`,
        kind: 'promoted',
      }
    case 'cancellation':
      return {
        encryptedPayload: null,
        idempotencyKey: `${registrationID}:cancel:${intent.transitionID}`,
        kind: 'cancelled',
      }
    case 'eventClosure':
      return {
        encryptedPayload: null,
        idempotencyKey: `${registrationID}:closure:${intent.transitionID}`,
        kind: intent.kind,
      }
    case 'resend': {
      const identity = intent.token ? await hashToken(intent.token) : intent.transitionID
      return {
        encryptedPayload: intent.token
          ? await encryptDeliveryPayload({ token: intent.token })
          : null,
        idempotencyKey: `${registrationID}:resend:${identity}`,
        kind: intent.kind,
      }
    }
  }
}

async function claimRegistrationDelivery(payload: Payload, deliveryID: number) {
  const now = new Date()
  const retentionCutoff = new Date(now)
  retentionCutoff.setUTCFullYear(retentionCutoff.getUTCFullYear() - 1)
  const lockToken = crypto.randomUUID()
  const result = await d1(payload)
    .prepare(
      `
    UPDATE registration_deliveries
    SET status = 'processing', attempts = attempts + 1, locked_at = ?, lock_token = ?, updated_at = ?
    WHERE id = ? AND attempts < ? AND EXISTS (
      SELECT 1 FROM registrations r INNER JOIN events e ON e.id = r.event_id
      WHERE r.id = registration_deliveries.registration_id
        AND r.status != 'anonymized' AND e.starts_at >= ?
    ) AND status = 'pending' AND next_attempt_at <= ?
  `,
    )
    .bind(
      now.toISOString(),
      lockToken,
      now.toISOString(),
      deliveryID,
      MAX_ATTEMPTS,
      retentionCutoff.toISOString(),
      now.toISOString(),
    )
    .run()
  if (result.meta.changes !== 1) return null
  const claimed = await payload.findByID({
    collection: 'registration-deliveries',
    id: deliveryID,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return { claimed, lockToken }
}

async function isCurrentDeliveryIntent(
  delivery: RegistrationDelivery,
  registration: Registration,
  event: Event,
  token?: string,
) {
  const registrationID = String(registration.id)
  if (delivery.kind === 'cancelled') {
    if (delivery.idempotencyKey.startsWith(`${registrationID}:resend:`))
      return registration.status === 'cancelled'
    return (
      registration.status === 'cancelled' &&
      Boolean(registration.lifecycleTransitionId) &&
      delivery.idempotencyKey === `${registrationID}:cancel:${registration.lifecycleTransitionId}`
    )
  }
  if (
    delivery.kind === 'eventCancelled' ||
    delivery.kind === 'registrationClosed' ||
    delivery.kind === 'registrationChanged'
  ) {
    return (
      registration.status === 'cancelled' &&
      Boolean(registration.lifecycleTransitionId) &&
      delivery.idempotencyKey === `${registrationID}:closure:${registration.lifecycleTransitionId}`
    )
  }

  const expectedStatus = delivery.kind === 'waitlisted' ? 'waitlisted' : 'confirmed'
  if (
    registration.status !== expectedStatus ||
    event._status !== 'published' ||
    event.registrationMode !== 'internal' ||
    event.registrationClosurePendingAt
  )
    return false
  if (!token || !registration.cancellationTokenHash) return false
  return (await hashToken(token)) === registration.cancellationTokenHash
}

async function failClaimedDelivery(
  payload: Payload,
  deliveryID: number,
  lockToken: string,
  lastError: string,
) {
  return d1(payload)
    .prepare(
      `
    UPDATE registration_deliveries
    SET encrypted_payload = NULL, last_error = ?, locked_at = NULL, lock_token = NULL,
        next_attempt_at = NULL, status = 'failed', updated_at = ?
    WHERE id = ? AND status = 'processing' AND lock_token = ?
  `,
    )
    .bind(lastError, new Date().toISOString(), deliveryID, lockToken)
    .run()
}

export async function processRegistrationDelivery(
  payload: Payload,
  delivery: RegistrationDelivery,
) {
  if (delivery.status === 'sent') return true
  const claim = await claimRegistrationDelivery(payload, delivery.id)
  if (!claim) return false
  const { claimed, lockToken } = claim

  try {
    const registration =
      typeof claimed.registration === 'object'
        ? claimed.registration
        : await payload.findByID({
            collection: 'registrations',
            id: claimed.registration,
            overrideAccess: true,
            showHiddenFields: true,
          })
    const event =
      typeof claimed.event === 'object'
        ? claimed.event
        : await payload.findByID({
            collection: 'events',
            id: claimed.event,
            locale: registration.locale,
            overrideAccess: true,
          })
    const { token } = await decryptDeliveryPayload(claimed.encryptedPayload)
    if (!(await isCurrentDeliveryIntent(claimed, registration, event, token))) {
      await failClaimedDelivery(payload, claimed.id, lockToken, SUPERSEDED_ERROR)
      return false
    }
    const result = await sendRegistrationEmail({
      event,
      kind: claimed.kind,
      messageIdentity: claimed.idempotencyKey,
      registration,
      token,
    })
    const sentAt = new Date().toISOString()
    const persisted = await d1(payload)
      .prepare(
        `
      UPDATE registration_deliveries
      SET encrypted_payload = NULL, last_error = NULL, locked_at = NULL, lock_token = NULL,
          next_attempt_at = NULL, provider_message_id = ?, sent_at = ?, status = 'sent', updated_at = ?
      WHERE id = ? AND status = 'processing' AND lock_token = ?
    `,
      )
      .bind(result.messageId, sentAt, sentAt, claimed.id, lockToken)
      .run()
    return persisted.meta.changes === 1
  } catch (error) {
    const message = safeErrorMessage(error)
    const failed = claimed.attempts >= MAX_ATTEMPTS
    payload.logger.error(
      {
        deliveryID: claimed.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        message,
      },
      'Registration delivery failed',
    )
    await d1(payload)
      .prepare(
        `
      UPDATE registration_deliveries
      SET encrypted_payload = CASE WHEN ? THEN NULL ELSE encrypted_payload END,
          last_error = ?, locked_at = NULL, lock_token = NULL, next_attempt_at = ?, status = ?, updated_at = ?
      WHERE id = ? AND status = 'processing' AND lock_token = ?
    `,
      )
      .bind(
        failed ? 1 : 0,
        message,
        failed ? null : retryAt(claimed.attempts),
        failed ? 'failed' : 'pending',
        new Date().toISOString(),
        claimed.id,
        lockToken,
      )
      .run()
    return false
  }
}

export async function processPendingRegistrationDeliveries(payload: Payload, limit = 25) {
  const now = new Date().toISOString()
  const stale = new Date(Date.now() - PROCESSING_TIMEOUT_MS).toISOString()
  const uncertain = await d1(payload)
    .prepare(
      `
    UPDATE registration_deliveries
    SET encrypted_payload = NULL, last_error = ?, locked_at = NULL, lock_token = NULL,
        next_attempt_at = NULL, status = 'failed', updated_at = ?
    WHERE status = 'processing' AND locked_at < ?
  `,
    )
    .bind(UNKNOWN_OUTCOME_ERROR, now, stale)
    .run()
  const due = await payload.find({
    collection: 'registration-deliveries',
    overrideAccess: true,
    depth: 0,
    limit: Math.min(Math.max(limit, 1), 100),
    sort: 'createdAt',
    where: {
      and: [{ status: { equals: 'pending' } }, { nextAttemptAt: { less_than_equal: now } }],
    },
  })
  let sent = 0
  for (const delivery of due.docs)
    if (await processRegistrationDelivery(payload, delivery)) sent += 1
  return { processed: due.docs.length, sent, uncertain: uncertain.meta.changes }
}
