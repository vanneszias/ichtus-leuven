import type { Endpoint } from 'payload'

import { hasRole } from '@/access'
import { processPendingRegistrationDeliveries } from '@/lib/registrationDeliveries'
import { isAllowedOrigin, validateTurnstile } from '@/lib/registrationSecurity'
import {
  anonymizeOldRegistrations,
  cancelRegistration,
  createRegistration,
  processEventRegistrationClosures,
  RegistrationError,
  resendRegistration,
} from '@/lib/registrations'
import { validateRegistrationFields } from '@/lib/registrationValidation'
import { requiredSecret } from '@/lib/runtimeConfig'
import { pruneShortLinkClicks } from '@/lib/shortLinks'

const noStore = { 'Cache-Control': 'no-store' }
const MAINTENANCE_TIME_BUDGET_MS = 20_000

function safeCell(value: unknown) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export const registrationSignup: Endpoint = {
  path: '/activity-signup',
  method: 'post',
  handler: async (req) => {
    if (!isAllowedOrigin(req))
      return Response.json({ error: 'Invalid request' }, { status: 403, headers: noStore })
    let input: {
      email?: string
      eventID?: number
      locale?: string
      name?: string
      turnstileToken?: string
      website?: string
    }
    try {
      input = await req.json()
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400, headers: noStore })
    }
    if (input.website) return Response.json({ ok: true, status: 'received' }, { headers: noStore })
    if (!(await validateTurnstile(input.turnstileToken)))
      return Response.json({ error: 'Verification failed' }, { status: 400, headers: noStore })
    const fieldErrors = validateRegistrationFields(input)
    if (Object.keys(fieldErrors).length) {
      return Response.json(
        { error: 'Check the form fields', fieldErrors },
        { status: 400, headers: noStore },
      )
    }
    if (!Number.isInteger(input.eventID) || !['nl', 'en'].includes(input.locale || '')) {
      return Response.json({ error: 'Check the form fields' }, { status: 400, headers: noStore })
    }

    try {
      const event = await req.payload.findByID({
        collection: 'events',
        id: input.eventID,
        locale: input.locale as 'nl' | 'en',
        overrideAccess: true,
      })
      const registration = await createRegistration(req.payload, event, {
        email: input.email,
        locale: input.locale as 'nl' | 'en',
        name: input.name,
      })
      return Response.json(
        { ok: true, status: registration.status },
        { status: 201, headers: noStore },
      )
    } catch (error) {
      if (error instanceof RegistrationError) {
        if (error.code === 'duplicate')
          return Response.json({ ok: true, status: 'received' }, { headers: noStore })
        return Response.json(
          { error: error.code },
          { status: error.code === 'notFound' ? 404 : 409, headers: noStore },
        )
      }
      if (error instanceof Error && 'status' in error && error.status === 404) {
        return Response.json({ error: 'notFound' }, { status: 404, headers: noStore })
      }
      req.payload.logger.error(
        { errorName: error instanceof Error ? error.name : 'UnknownError' },
        'Registration signup failed',
      )
      return Response.json({ error: 'Unable to register' }, { status: 500, headers: noStore })
    }
  },
}

export const registrationCancel: Endpoint = {
  path: '/activity-cancel',
  method: 'post',
  handler: async (req) => {
    if (!isAllowedOrigin(req))
      return Response.json({ error: 'Invalid request' }, { status: 403, headers: noStore })
    const input = (await req.json().catch(() => ({}))) as { token?: string }
    if (!input.token || !/^[a-f0-9]{64}$/.test(input.token))
      return Response.json({ error: 'Invalid link' }, { status: 400, headers: noStore })
    try {
      await cancelRegistration(req.payload, input.token)
      return Response.json({ ok: true }, { headers: noStore })
    } catch (error) {
      if (error instanceof RegistrationError && error.code === 'notFound')
        return Response.json({ error: 'Invalid link' }, { status: 404, headers: noStore })
      req.payload.logger.error(
        { errorName: error instanceof Error ? error.name : 'UnknownError' },
        'Registration cancellation failed',
      )
      return Response.json({ error: 'Unable to cancel' }, { status: 500, headers: noStore })
    }
  },
}

export const registrationExport: Endpoint = {
  path: '/registration-export',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user, ['admin', 'registrationManager']))
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const url = new URL(req.url || 'http://localhost')
    const eventID = Number(url.searchParams.get('event'))
    if (!Number.isInteger(eventID))
      return Response.json({ error: 'Choose an event' }, { status: 400, headers: noStore })
    const status = url.searchParams.get('status')
    const where =
      status && ['confirmed', 'waitlisted', 'cancelled'].includes(status)
        ? { and: [{ event: { equals: eventID } }, { status: { equals: status } }] }
        : { event: { equals: eventID } }
    const result = await req.payload.find({
      collection: 'registrations',
      overrideAccess: true,
      pagination: false,
      sort: 'createdAt',
      where,
    })
    const rows = [
      ['Name', 'Email', 'Status', 'Registered at', 'Cancelled at'].map(safeCell).join(','),
      ...result.docs.map((registration) =>
        [
          registration.name,
          registration.email,
          registration.status,
          registration.createdAt,
          registration.cancelledAt,
        ]
          .map(safeCell)
          .join(','),
      ),
    ]
    req.payload.logger.info(
      { eventID, exportedBy: req.user?.id, rows: result.docs.length },
      'Registrations exported',
    )
    return new Response(`\uFEFF${rows.join('\r\n')}`, {
      headers: {
        ...noStore,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registrations-${eventID}.csv"`,
      },
    })
  },
}

export const registrationResend: Endpoint = {
  path: '/registration-resend',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, ['admin', 'registrationManager']))
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const input = (await req.json().catch(() => ({}))) as { id?: number }
    if (!Number.isInteger(input.id))
      return Response.json({ error: 'Invalid registration' }, { status: 400, headers: noStore })
    const registration = await req.payload.findByID({
      collection: 'registrations',
      id: input.id,
      overrideAccess: true,
    })
    const event =
      typeof registration.event === 'object'
        ? registration.event
        : await req.payload.findByID({
            collection: 'events',
            id: registration.event,
            locale: registration.locale,
            overrideAccess: true,
          })
    await resendRegistration(req.payload, registration, event)
    return Response.json({ ok: true }, { headers: noStore })
  },
}

export const registrationDeliveries: Endpoint = {
  path: '/registration-delivery-process',
  method: 'post',
  handler: async (req) => {
    let secret: string
    try {
      secret = requiredSecret('REGISTRATION_DELIVERY_SECRET')
    } catch {
      return Response.json({ error: 'Unavailable' }, { status: 503, headers: noStore })
    }
    if (req.headers.get('authorization') !== `Bearer ${secret}`)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const result = await processPendingRegistrationDeliveries(req.payload)
    return Response.json(result, { headers: noStore })
  },
}

export const registrationCleanup: Endpoint = {
  path: '/registration-cleanup',
  method: 'post',
  handler: async (req) => {
    let secret: string
    try {
      secret = requiredSecret('REGISTRATION_CLEANUP_SECRET')
    } catch {
      return Response.json({ error: 'Unavailable' }, { status: 503, headers: noStore })
    }
    if (req.headers.get('authorization') !== `Bearer ${secret}`)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const input = (await req.json().catch(() => ({}))) as { limit?: number }
    const limit = Number.isInteger(input.limit) ? input.limit : 25
    const deadline = Date.now() + MAINTENANCE_TIME_BUDGET_MS
    const closures = { completedEvents: 0, hasMore: true, processed: 0 }
    const retention = { anonymized: 0, deferred: false, hasMore: true }
    // This is the site's only recurring maintenance run, so short link click
    // rows age out here rather than behind a second cron and a second secret.
    const shortLinkClicks = { deleted: 0, hasMore: true }

    do {
      if (closures.hasMore) {
        const batch = await processEventRegistrationClosures(req.payload, limit)
        closures.completedEvents += batch.completedEvents
        closures.processed += batch.processed
        closures.hasMore = batch.hasMore
      }
      if (retention.hasMore) {
        const batch = await anonymizeOldRegistrations(req.payload, limit)
        retention.anonymized += batch.anonymized
        retention.deferred = batch.deferred
        retention.hasMore = batch.hasMore
      }
      if (shortLinkClicks.hasMore) {
        const batch = await pruneShortLinkClicks(req.payload, limit)
        shortLinkClicks.deleted += batch.deleted
        shortLinkClicks.hasMore = batch.hasMore
      }
    } while (
      (closures.hasMore || retention.hasMore || shortLinkClicks.hasMore) &&
      Date.now() < deadline
    )

    const timedOut = closures.hasMore || retention.hasMore || shortLinkClicks.hasMore
    const needsContinuation = timedOut || retention.deferred
    return Response.json(
      { closures, needsContinuation, retention, shortLinkClicks, timedOut },
      { headers: noStore },
    )
  },
}
