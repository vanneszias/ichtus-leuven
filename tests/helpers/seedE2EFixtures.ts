import { getPayload } from 'payload'
import { hashToken } from '../../src/lib/registrationSecurity'
import config from '../../src/payload.config'
import { seedTestUser } from './seedUser'

const payload = await getPayload({ config })

async function removeEvent(id: number) {
  const deliveries = await payload.find({
    collection: 'registration-deliveries',
    overrideAccess: true,
    pagination: false,
    where: { event: { equals: id } },
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
    where: { event: { equals: id } },
  })
  for (const registration of registrations.docs)
    await payload.delete({ collection: 'registrations', id: registration.id, overrideAccess: true })

  await payload.delete({ collection: 'events', id, overrideAccess: true })
}

for (const title of ['Open registration test', 'SEO metadata test']) {
  const stale = await payload.find({
    collection: 'events',
    locale: 'nl',
    overrideAccess: true,
    pagination: false,
    where: { title: { equals: title } },
  })
  for (const event of stale.docs) await removeEvent(event.id)
}

await seedTestUser()

const registrationEvent = await payload.create({
  collection: 'events',
  overrideAccess: true,
  data: {
    _status: 'published',
    capacity: 1,
    endsAt: '2030-09-18T17:00:00.000Z',
    location: 'Leuven',
    registrationMode: 'internal',
    slug: 'open-registration-test',
    startsAt: '2030-09-18T15:00:00.000Z',
    summary: 'A browser-tested signup flow.',
    title: 'Open registration test',
    waitlistEnabled: true,
  },
})
await payload.create({
  collection: 'registrations',
  overrideAccess: true,
  data: {
    activeKey: `${registrationEvent.id}:cancellation-browser@example.com`,
    cancellationTokenHash: await hashToken('c'.repeat(64)),
    email: 'cancellation-browser@example.com',
    event: registrationEvent.id,
    locale: 'nl',
    name: 'Cancellation Browser',
    status: 'waitlisted',
  },
})

const seoEvent = await payload.create({
  collection: 'events',
  locale: 'nl',
  overrideAccess: true,
  data: {
    _status: 'published',
    endsAt: '2030-10-09T20:00:00.000Z',
    location: 'SEO Testzaal Leuven',
    registrationMode: 'internal',
    slug: 'seo-metadata-test',
    startsAt: '2030-10-09T18:00:00.000Z',
    summary: 'Controle van zoekmetadata.',
    title: 'SEO metadata test',
  },
})
await payload.update({
  collection: 'events',
  id: seoEvent.id,
  locale: 'en',
  overrideAccess: true,
  data: {
    _status: 'published',
    slug: 'seo-metadata-test-event',
    summary: 'Search metadata verification.',
    title: 'SEO metadata test event',
  },
})

process.exit(0)
