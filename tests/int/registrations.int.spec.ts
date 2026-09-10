import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  processPendingRegistrationDeliveries,
  processRegistrationDelivery,
} from '../../src/lib/registrationDeliveries'
import {
  decryptDeliveryPayload,
  encryptDeliveryPayload,
  hashToken,
} from '../../src/lib/registrationSecurity'
import {
  anonymizeOldRegistrations,
  cancelRegistration,
  createRegistration,
  processEventRegistrationClosures,
  promoteWaitlisted,
  resendRegistration,
} from '../../src/lib/registrations'
import config from '../../src/payload.config'
import type { Event, Registration, User } from '../../src/payload-types'

describe('activity registrations', () => {
  let payload: Payload
  let event: Event
  let activityManager: User
  const registrationIDs: number[] = []

  async function removeTestEvents() {
    const events = await payload.find({
      collection: 'events',
      locale: 'nl',
      overrideAccess: true,
      pagination: false,
      where: {
        or: [
          { title: { contains: 'Registration test' } },
          { title: { contains: 'Registration concurrency' } },
        ],
      },
    })
    for (const testEvent of events.docs) {
      const deliveries = await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        pagination: false,
        where: { event: { equals: testEvent.id } },
      })
      for (const delivery of deliveries.docs)
        await payload.delete({
          collection: 'registration-deliveries',
          id: delivery.id,
          overrideAccess: true,
        })
      const registrations = await payload.find({
        collection: 'registrations',
        overrideAccess: true,
        pagination: false,
        where: { event: { equals: testEvent.id } },
      })
      for (const registration of registrations.docs)
        await payload.delete({
          collection: 'registrations',
          id: registration.id,
          overrideAccess: true,
        })
      await payload.delete({ collection: 'events', id: testEvent.id, overrideAccess: true })
    }
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
    await removeTestEvents()
    activityManager = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email: `registration-manager-${Date.now()}@example.com`,
        password: 'integration-test-password',
        role: 'registrationManager',
      },
    })
    event = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration test ${Date.now()}`,
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        registrationMode: 'internal',
        capacity: 1,
        waitlistEnabled: true,
        _status: 'published',
      },
    })
  })

  afterAll(async () => {
    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: event.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    for (const id of registrationIDs)
      await payload
        .delete({ collection: 'registrations', id, overrideAccess: true })
        .catch((): undefined => undefined)
    if (event)
      await payload
        .delete({ collection: 'events', id: event.id, overrideAccess: true })
        .catch((): undefined => undefined)
    if (activityManager)
      await payload
        .delete({ collection: 'users', id: activityManager.id, overrideAccess: true })
        .catch((): undefined => undefined)
  })

  it('denies anonymous collection access', async () => {
    await expect(
      payload.create({
        collection: 'registrations',
        overrideAccess: false,
        data: {
          event: event.id,
          name: 'Anonymous',
          email: 'anonymous@example.com',
          locale: 'en',
          status: 'confirmed',
        },
      }),
    ).rejects.toThrow()
  })

  it('encrypts retryable cancellation tokens at rest', async () => {
    const token = 'b'.repeat(64)
    const encrypted = await encryptDeliveryPayload({ token })
    expect(encrypted).not.toContain(token)
    await expect(decryptDeliveryPayload(encrypted)).resolves.toEqual({ token })
  })

  it('confirms the first signup and waitlists the next', async () => {
    const first = await createRegistration(payload, event, {
      email: ' FIRST@Example.com ',
      locale: 'en',
      name: 'First Student',
    })
    const second = await createRegistration(payload, event, {
      email: 'second@example.com',
      locale: 'en',
      name: 'Second Student',
    })
    registrationIDs.push(first.id, second.id)

    expect(first.status).toBe('confirmed')
    expect(first.email).toBe('first@example.com')
    expect(second.status).toBe('waitlisted')

    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      where: { event: { equals: event.id } },
    })
    expect(deliveries.totalDocs).toBe(2)
    expect(
      deliveries.docs.every(
        (delivery) =>
          delivery.encryptedPayload && !delivery.encryptedPayload.includes('first@example.com'),
      ),
    ).toBe(true)

    await expect(
      createRegistration(payload, event, {
        email: 'first@example.com',
        locale: 'en',
        name: 'Duplicate',
      }),
    ).rejects.toMatchObject({ code: 'duplicate' })
  })

  it('promotes the oldest waitlisted signup after a place opens', async () => {
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      sort: 'createdAt',
      where: { event: { equals: event.id } },
    })
    const confirmed = registrations.docs.find((item) => item.status === 'confirmed')
    const waiting = registrations.docs.find((item) => item.status === 'waitlisted')
    await payload.update({
      collection: 'registrations',
      id: confirmed.id,
      overrideAccess: true,
      data: { activeKey: null, status: 'cancelled' },
    })

    const promoted = await promoteWaitlisted(payload, event)
    expect(promoted?.id).toBe(waiting.id)
    expect(promoted?.status).toBe('confirmed')
  })

  it('cancels through a hashed token without storing the token itself', async () => {
    const token = 'a'.repeat(64)
    const registration = (await payload.create({
      collection: 'registrations',
      overrideAccess: true,
      data: {
        event: event.id,
        name: 'Token Student',
        email: 'token@example.com',
        locale: 'nl',
        status: 'waitlisted',
        activeKey: `${event.id}:token@example.com`,
        cancellationTokenHash: await hashToken(token),
      },
    })) as Registration
    registrationIDs.push(registration.id)

    const cancelled = await cancelRegistration(payload, token)
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.activeKey).toBeNull()
    expect(cancelled.cancellationTokenHash).toBe(await hashToken(token))
    await expect(cancelRegistration(payload, token)).resolves.toMatchObject({
      id: registration.id,
      status: 'cancelled',
    })
  })

  it('keeps confirmed attendance within capacity under concurrent signup', async () => {
    const concurrentEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration concurrency ${Date.now()}`,
        startsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        registrationMode: 'internal',
        capacity: 1,
        waitlistEnabled: true,
        _status: 'published',
      },
    })
    const results = await Promise.all([
      createRegistration(payload, concurrentEvent, {
        email: 'concurrent-one@example.com',
        locale: 'en',
        name: 'Concurrent One',
      }),
      createRegistration(payload, concurrentEvent, {
        email: 'concurrent-two@example.com',
        locale: 'en',
        name: 'Concurrent Two',
      }),
    ])
    expect(results.filter((registration) => registration.status === 'confirmed')).toHaveLength(1)
    expect(results.filter((registration) => registration.status === 'waitlisted')).toHaveLength(1)

    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: concurrentEvent.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: concurrentEvent.id } },
    })
    for (const registration of registrations.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: concurrentEvent.id, overrideAccess: true })
  })

  it('treats a no-waitlist capacity race as full and rolls back its delivery intent', async () => {
    const raceEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration concurrency no waitlist ${Date.now()}`,
        startsAt: new Date(Date.now() + 9 * 86400000).toISOString(),
        registrationMode: 'internal',
        capacity: 1,
        waitlistEnabled: false,
        _status: 'published',
      },
    })
    const results = await Promise.allSettled([
      createRegistration(payload, raceEvent, {
        email: 'race-one@example.com',
        locale: 'en',
        name: 'Race One',
      }),
      createRegistration(payload, raceEvent, {
        email: 'race-two@example.com',
        locale: 'en',
        name: 'Race Two',
      }),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { code: 'full' },
    })
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: raceEvent.id } },
    })
    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: raceEvent.id } },
    })
    expect(registrations.totalDocs).toBe(1)
    expect(deliveries.totalDocs).toBe(1)
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    for (const registration of registrations.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: raceEvent.id, overrideAccess: true })
  })

  it('atomically claims one delivery across concurrent workers', async () => {
    const delivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { event: { equals: event.id } },
      })
    ).docs[0]
    const globalContext = globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<unknown>
    }
    const previousContext = globalContext.__ichtusCloudflareContext
    const previousFromAddress = process.env.EMAIL_FROM_ADDRESS
    process.env.EMAIL_FROM_ADDRESS = 'hello@example.com'
    let sends = 0
    globalContext.__ichtusCloudflareContext = Promise.resolve({
      env: {
        EMAIL: {
          send: async () => {
            sends += 1
            return { messageId: 'provider-message' }
          },
        },
      },
    })
    try {
      const results = await Promise.all([
        processRegistrationDelivery(payload, delivery),
        processRegistrationDelivery(payload, delivery),
      ])
      expect(results.filter(Boolean)).toHaveLength(1)
      expect(sends).toBe(1)
      const persisted = await payload.findByID({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
      expect(persisted).toMatchObject({
        attempts: 1,
        providerMessageId: 'provider-message',
        status: 'sent',
      })
    } finally {
      globalContext.__ichtusCloudflareContext = previousContext
      process.env.EMAIL_FROM_ADDRESS = previousFromAddress
    }
  })

  it('returns failed sends to pending with sanitized retry state', async () => {
    const delivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { status: { equals: 'pending' } },
      })
    ).docs[0]
    const globalContext = globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<unknown>
    }
    const previousContext = globalContext.__ichtusCloudflareContext
    const previousFromAddress = process.env.EMAIL_FROM_ADDRESS
    process.env.EMAIL_FROM_ADDRESS = 'hello@example.com'
    globalContext.__ichtusCloudflareContext = Promise.resolve({
      env: {
        EMAIL: {
          send: async () => {
            throw new Error(`Provider rejected student@example.com ${'d'.repeat(64)}`)
          },
        },
      },
    })
    try {
      await expect(processRegistrationDelivery(payload, delivery)).resolves.toBe(false)
      const pending = await payload.findByID({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
      expect(pending).toMatchObject({ attempts: 1, status: 'pending' })
      expect(pending.lastError).toBe('Email provider failed (Error)')
      expect(pending.lastError).not.toContain('student@example.com')
      expect(pending.lastError).not.toContain('d'.repeat(64))
      const database = payload.db.drizzle.$client as unknown as D1Database
      await database
        .prepare('UPDATE registration_deliveries SET next_attempt_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), delivery.id)
        .run()
      globalContext.__ichtusCloudflareContext = Promise.resolve({
        env: { EMAIL: { send: async () => ({ messageId: 'retry-provider-message' }) } },
      })
      const retry = await payload.findByID({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
      await expect(processRegistrationDelivery(payload, retry)).resolves.toBe(true)
      const sent = await payload.findByID({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
      expect(sent).toMatchObject({
        attempts: 2,
        lastError: null,
        providerMessageId: 'retry-provider-message',
        status: 'sent',
      })
    } finally {
      globalContext.__ichtusCloudflareContext = previousContext
      process.env.EMAIL_FROM_ADDRESS = previousFromAddress
    }
  })

  it('does not send an intent whose cancellation token was superseded', async () => {
    const staleEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration stale delivery ${Date.now()}`,
        startsAt: new Date(Date.now() + 9 * 86400000).toISOString(),
        registrationMode: 'internal',
        _status: 'published',
      },
    })
    const registration = await createRegistration(payload, staleEvent, {
      email: 'stale-delivery@example.com',
      locale: 'en',
      name: 'Stale Delivery',
    })
    const signup = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        showHiddenFields: true,
        limit: 1,
        where: {
          and: [{ registration: { equals: registration.id } }, { kind: { equals: 'confirmed' } }],
        },
      })
    ).docs[0]
    await resendRegistration(payload, registration, staleEvent)

    const globalContext = globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<unknown>
    }
    const previousContext = globalContext.__ichtusCloudflareContext
    const previousFromAddress = process.env.EMAIL_FROM_ADDRESS
    process.env.EMAIL_FROM_ADDRESS = 'hello@example.com'
    let sends = 0
    globalContext.__ichtusCloudflareContext = Promise.resolve({
      env: {
        EMAIL: {
          send: async () => {
            sends += 1
            return { messageId: 'unexpected' }
          },
        },
      },
    })
    try {
      await expect(processRegistrationDelivery(payload, signup)).resolves.toBe(false)
      expect(sends).toBe(0)
      const failed = await payload.findByID({
        collection: 'registration-deliveries',
        id: signup.id,
        overrideAccess: true,
        showHiddenFields: true,
      })
      expect(failed).toMatchObject({
        encryptedPayload: null,
        lastError: 'Delivery intent superseded by a later registration transition',
        status: 'failed',
      })
    } finally {
      globalContext.__ichtusCloudflareContext = previousContext
      process.env.EMAIL_FROM_ADDRESS = previousFromAddress
    }

    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: staleEvent.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'registrations', id: registration.id, overrideAccess: true })
    await payload.delete({ collection: 'events', id: staleEvent.id, overrideAccess: true })
  })

  it('terminalizes an expired processing lease instead of sending it again', async () => {
    const delivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        showHiddenFields: true,
        limit: 1,
        where: { status: { equals: 'pending' } },
      })
    ).docs[0]
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database
      .prepare(
        `UPDATE registration_deliveries SET status = 'processing', locked_at = ?, lock_token = 'expired-test-lock' WHERE id = ?`,
      )
      .bind(new Date(Date.now() - 16 * 60 * 1000).toISOString(), delivery.id)
      .run()
    const result = await processPendingRegistrationDeliveries(payload, 1)
    expect(result.uncertain).toBeGreaterThanOrEqual(1)
    const failed = await payload.findByID({
      collection: 'registration-deliveries',
      id: delivery.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(failed).toMatchObject({
      encryptedPayload: null,
      lastError:
        'Delivery outcome unknown after processing lease expired; administrator resend required',
      status: 'failed',
    })
  })

  it('rolls back token rotation when resend delivery creation fails', async () => {
    const registration = (
      await payload.find({
        collection: 'registrations',
        overrideAccess: true,
        showHiddenFields: true,
        limit: 100,
        where: { and: [{ event: { equals: event.id } }, { status: { equals: 'confirmed' } }] },
      })
    ).docs[0]
    const oldHash = registration.cancellationTokenHash
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database.exec(
      "CREATE TRIGGER test_resend_failure BEFORE INSERT ON registration_deliveries BEGIN SELECT RAISE(ABORT, 'TEST_RESEND_FAILURE'); END;",
    )
    try {
      await expect(resendRegistration(payload, registration, event)).rejects.toThrow(
        'TEST_RESEND_FAILURE',
      )
    } finally {
      await database.exec('DROP TRIGGER test_resend_failure;')
    }
    const unchanged = await payload.findByID({
      collection: 'registrations',
      id: registration.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(unchanged.cancellationTokenHash).toBe(oldHash)
  })

  it('rolls back signup when its durable delivery cannot be queued', async () => {
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database.exec(
      "CREATE TRIGGER test_signup_delivery_failure BEFORE INSERT ON registration_deliveries BEGIN SELECT RAISE(ABORT, 'TEST_QUEUE_FAILURE'); END;",
    )
    try {
      await expect(
        createRegistration(payload, event, {
          email: 'queue-failure@example.com',
          locale: 'en',
          name: 'Queue Failure',
        }),
      ).rejects.toThrow('TEST_QUEUE_FAILURE')
    } finally {
      await database.exec('DROP TRIGGER test_signup_delivery_failure;')
    }
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      where: { email: { equals: 'queue-failure@example.com' } },
    })
    expect(registrations.totalDocs).toBe(0)
  })

  it('cancels once and promotes at most one oldest waiter under concurrent requests', async () => {
    const cancellationEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration cancellation concurrency ${Date.now()}`,
        startsAt: new Date(Date.now() + 11 * 86400000).toISOString(),
        registrationMode: 'internal',
        capacity: 1,
        waitlistEnabled: true,
        _status: 'published',
      },
    })
    const confirmed = await createRegistration(payload, cancellationEvent, {
      email: 'cancel-confirmed@example.com',
      locale: 'en',
      name: 'Confirmed',
    })
    const oldest = await createRegistration(payload, cancellationEvent, {
      email: 'cancel-oldest@example.com',
      locale: 'en',
      name: 'Oldest',
    })
    await createRegistration(payload, cancellationEvent, {
      email: 'cancel-next@example.com',
      locale: 'en',
      name: 'Next',
    })
    const withToken = await payload.findByID({
      collection: 'registrations',
      id: confirmed.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    const signupDelivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        showHiddenFields: true,
        limit: 1,
        where: { registration: { equals: confirmed.id } },
      })
    ).docs[0]
    const { token } = await decryptDeliveryPayload(signupDelivery.encryptedPayload)
    expect(token).toBeTruthy()
    await Promise.all([cancelRegistration(payload, token), cancelRegistration(payload, token)])
    const active = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      sort: 'createdAt',
      where: { event: { equals: cancellationEvent.id } },
    })
    expect(active.docs.filter((item) => item.status === 'confirmed')).toHaveLength(1)
    expect(active.docs.find((item) => item.status === 'confirmed')?.id).toBe(oldest.id)
    const promotions = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      where: {
        and: [{ event: { equals: cancellationEvent.id } }, { kind: { equals: 'promoted' } }],
      },
    })
    expect(promotions.totalDocs).toBe(1)
    expect(withToken.cancellationTokenHash).toBeTruthy()
    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: cancellationEvent.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    for (const registration of active.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: cancellationEvent.id, overrideAccess: true })
  })

  it('records and resumes event closure work in bounded batches', async () => {
    const closureEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration closure ${Date.now()}`,
        startsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        registrationMode: 'internal',
        _status: 'published',
      },
    })
    await createRegistration(payload, closureEvent, {
      email: 'closure-one@example.com',
      locale: 'en',
      name: 'Closure One',
    })
    await createRegistration(payload, closureEvent, {
      email: 'closure-two@example.com',
      locale: 'en',
      name: 'Closure Two',
    })
    const unpublished = await payload.update({
      collection: 'events',
      id: closureEvent.id,
      overrideAccess: true,
      data: { _status: 'draft' },
    })
    expect(unpublished.registrationClosurePendingAt).toBeTruthy()
    await expect(
      payload.update({
        collection: 'events',
        id: closureEvent.id,
        overrideAccess: true,
        data: { registrationMode: 'none' },
      }),
    ).rejects.toThrow('Bevestig expliciet')
    const first = await processEventRegistrationClosures(payload, 1)
    expect(first.processed).toBe(1)
    expect(first.hasMore).toBe(true)
    expect(
      (
        await payload.count({
          collection: 'registrations',
          overrideAccess: true,
          where: {
            and: [
              { event: { equals: closureEvent.id } },
              { status: { in: ['confirmed', 'waitlisted'] } },
            ],
          },
        })
      ).totalDocs,
    ).toBe(1)
    const final = await processEventRegistrationClosures(payload, 10)
    expect(final.hasMore).toBe(false)
    const completed = await payload.findByID({
      collection: 'events',
      id: closureEvent.id,
      overrideAccess: true,
    })
    expect(completed.registrationClosurePendingAt).toBeNull()
    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: closureEvent.id } },
    })
    expect(deliveries.docs.filter((item) => item.kind === 'registrationClosed')).toHaveLength(2)
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: closureEvent.id } },
    })
    for (const registration of registrations.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: closureEvent.id, overrideAccess: true })
  })

  it('does not promote a waiter after event closure starts', async () => {
    const closingEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration closing cancellation ${Date.now()}`,
        startsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        registrationMode: 'internal',
        capacity: 1,
        waitlistEnabled: true,
        _status: 'published',
      },
    })
    const confirmed = await createRegistration(payload, closingEvent, {
      email: 'closing-confirmed@example.com',
      locale: 'en',
      name: 'Closing Confirmed',
    })
    const waiting = await createRegistration(payload, closingEvent, {
      email: 'closing-waiting@example.com',
      locale: 'en',
      name: 'Closing Waiting',
    })
    const signupDelivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        showHiddenFields: true,
        limit: 1,
        where: {
          and: [{ registration: { equals: confirmed.id } }, { kind: { equals: 'confirmed' } }],
        },
      })
    ).docs[0]
    const { token } = await decryptDeliveryPayload(signupDelivery.encryptedPayload)

    await payload.update({
      collection: 'events',
      id: closingEvent.id,
      overrideAccess: true,
      data: { _status: 'draft' },
    })
    await cancelRegistration(payload, token)

    const unchangedWaiter = await payload.findByID({
      collection: 'registrations',
      id: waiting.id,
      overrideAccess: true,
    })
    expect(unchangedWaiter.status).toBe('waitlisted')
    const closedEvent = await payload.findByID({
      collection: 'events',
      id: closingEvent.id,
      overrideAccess: true,
    })
    await expect(promoteWaitlisted(payload, closedEvent)).resolves.toBeNull()
    const promotions = await payload.count({
      collection: 'registration-deliveries',
      overrideAccess: true,
      where: { and: [{ event: { equals: closingEvent.id } }, { kind: { equals: 'promoted' } }] },
    })
    expect(promotions.totalDocs).toBe(0)

    await processEventRegistrationClosures(payload, 10)
    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: closingEvent.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: closingEvent.id } },
    })
    for (const registration of registrations.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: closingEvent.id, overrideAccess: true })
  })

  it('enforces capacity reduction in D1 even when collection validation is bypassed', async () => {
    await expect(
      payload.create({
        collection: 'events',
        overrideAccess: true,
        data: {
          title: `Registration fractional capacity ${Date.now()}`,
          startsAt: new Date(Date.now() + 12 * 86400000).toISOString(),
          registrationMode: 'internal',
          capacity: 1.5,
          _status: 'published',
        },
      }),
    ).rejects.toThrow('invalid: Capacity')
    const capacityEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration capacity reduction ${Date.now()}`,
        startsAt: new Date(Date.now() + 12 * 86400000).toISOString(),
        registrationMode: 'internal',
        capacity: 2,
        waitlistEnabled: false,
        _status: 'published',
      },
    })
    await createRegistration(payload, capacityEvent, {
      email: 'capacity-one@example.com',
      locale: 'en',
      name: 'Capacity One',
    })
    await createRegistration(payload, capacityEvent, {
      email: 'capacity-two@example.com',
      locale: 'en',
      name: 'Capacity Two',
    })
    const database = payload.db.drizzle.$client as unknown as D1Database
    await expect(
      database
        .prepare('UPDATE events SET capacity = 1.5 WHERE id = ?')
        .bind(capacityEvent.id)
        .run(),
    ).rejects.toThrow('EVENT_CAPACITY_INVALID')
    await expect(
      database.prepare('UPDATE events SET capacity = 1 WHERE id = ?').bind(capacityEvent.id).run(),
    ).rejects.toThrow('EVENT_CAPACITY_BELOW_CONFIRMED')

    const deliveries = await payload.find({
      collection: 'registration-deliveries',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: capacityEvent.id } },
    })
    for (const delivery of deliveries.docs)
      await payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: true,
      })
    const registrations = await payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      where: { event: { equals: capacityEvent.id } },
    })
    for (const registration of registrations.docs)
      await payload.delete({
        collection: 'registrations',
        id: registration.id,
        overrideAccess: true,
      })
    await payload.delete({ collection: 'events', id: capacityEvent.id, overrideAccess: true })
  })

  it('anonymizes personal and retry payload data after twelve months in bounded work', async () => {
    const oldEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration retention ${Date.now()}`,
        startsAt: new Date(Date.now() - 370 * 86400000).toISOString(),
        registrationMode: 'none',
        _status: 'draft',
      },
    })
    const oldRegistration = await payload.create({
      collection: 'registrations',
      overrideAccess: true,
      data: {
        event: oldEvent.id,
        name: 'Old Student',
        email: 'old@example.com',
        locale: 'en',
        status: 'cancelled',
        adminNotes: 'private',
      },
    })
    const encryptedPayload = await encryptDeliveryPayload({ token: 'c'.repeat(64) })
    const oldDelivery = await payload.create({
      collection: 'registration-deliveries',
      overrideAccess: true,
      data: {
        registration: oldRegistration.id,
        event: oldEvent.id,
        kind: 'cancelled',
        status: 'pending',
        attempts: 0,
        nextAttemptAt: new Date().toISOString(),
        idempotencyKey: `${oldRegistration.id}:retention-test`,
        encryptedPayload,
      },
    })
    const database = payload.db.drizzle.$client as unknown as D1Database
    await database
      .prepare('UPDATE registrations SET email_last_error = ? WHERE id = ?')
      .bind('Legacy failure for old@example.com', oldRegistration.id)
      .run()
    await payload.update({
      collection: 'registration-deliveries',
      id: oldDelivery.id,
      overrideAccess: true,
      data: { lockedAt: new Date().toISOString(), status: 'processing' },
    })
    expect(await anonymizeOldRegistrations(payload, 1)).toMatchObject({
      anonymized: 0,
      deferred: true,
      hasMore: false,
    })
    await payload.update({
      collection: 'registration-deliveries',
      id: oldDelivery.id,
      overrideAccess: true,
      data: { lockedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString() },
    })
    await processPendingRegistrationDeliveries(payload, 1)
    const result = await anonymizeOldRegistrations(payload, 1)
    expect(result.anonymized).toBe(1)
    const anonymized = await payload.findByID({
      collection: 'registrations',
      id: oldRegistration.id,
      overrideAccess: true,
    })
    const terminalDelivery = await payload.findByID({
      collection: 'registration-deliveries',
      id: oldDelivery.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(anonymized).toMatchObject({
      adminNotes: null,
      email: `anonymized-${oldRegistration.id}@invalid.local`,
      name: 'Anonymized',
      status: 'anonymized',
    })
    expect(terminalDelivery).toMatchObject({ encryptedPayload: null, status: 'failed' })
    const retained = await database
      .prepare('SELECT email_last_error FROM registrations WHERE id = ?')
      .bind(oldRegistration.id)
      .first<{ email_last_error: string | null }>()
    expect(retained?.email_last_error).toBeNull()
    await payload.delete({
      collection: 'registration-deliveries',
      id: oldDelivery.id,
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'registrations',
      id: oldRegistration.id,
      overrideAccess: true,
    })
    await payload.delete({ collection: 'events', id: oldEvent.id, overrideAccess: true })
  })

  it('keeps lifecycle collections read-only through normal administrative writes', async () => {
    await expect(
      payload.update({
        collection: 'registrations',
        id: registrationIDs[0],
        overrideAccess: false,
        data: { status: 'cancelled' },
      }),
    ).rejects.toThrow()
    const delivery = (
      await payload.find({
        collection: 'registration-deliveries',
        overrideAccess: true,
        limit: 1,
        where: { event: { equals: event.id } },
      })
    ).docs[0]
    await expect(
      payload.delete({
        collection: 'registration-deliveries',
        id: delivery.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('accepts closure state only from the event lifecycle hook', async () => {
    const closureEvent = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: `Registration system closure ${Date.now()}`,
        startsAt: new Date(Date.now() + 13 * 86400000).toISOString(),
        registrationMode: 'internal',
        _status: 'published',
      },
    })
    const forged = await payload.update({
      collection: 'events',
      id: closureEvent.id,
      overrideAccess: false,
      user: activityManager,
      data: {
        registrationClosurePendingAt: '2020-01-01T00:00:00.000Z',
        registrationClosureReason: 'upstreamCancelled',
      },
    })
    expect(forged.registrationClosurePendingAt).toBeNull()
    expect(forged.registrationClosureReason).toBeNull()

    const unpublished = await payload.update({
      collection: 'events',
      id: closureEvent.id,
      overrideAccess: false,
      user: activityManager,
      data: { _status: 'draft' },
    })
    expect(unpublished.registrationClosurePendingAt).toBeTruthy()
    expect(unpublished.registrationClosureReason).toBe('unpublished')
    await payload.delete({ collection: 'events', id: closureEvent.id, overrideAccess: true })
  })
})
