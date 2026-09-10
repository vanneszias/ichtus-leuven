import { GRAPHQL_POST, REST_GET, REST_POST } from '@payloadcms/next/routes'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { adminsOrFirstUser } from '@/access'
import config from '@/payload.config'

let payload: Payload
const userIDs: number[] = []
const restGet = REST_GET(config)
const restPost = REST_POST(config)
const graphqlPost = GRAPHQL_POST(config)

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        email: `api-access-admin-${Date.now()}@example.com`,
        password: 'integration-test-password',
        role: 'admin',
      },
      overrideAccess: true,
    })
    userIDs.push(user.id)
  })

  afterAll(async () => {
    for (const id of userIDs) {
      await payload.delete({ collection: 'users', id, overrideAccess: true })
    }
  })

  it('allows local bootstrap only while user storage is empty', async () => {
    const emptyCount = async () => ({ totalDocs: 0 })
    const populatedCount = async () => ({ totalDocs: 1 })
    const request: { payload: { count: typeof emptyCount }; user: unknown } = {
      payload: { count: emptyCount },
      user: null as unknown,
    }

    await expect(adminsOrFirstUser({ req: request } as never)).resolves.toBe(true)

    request.payload.count = populatedCount
    await expect(adminsOrFirstUser({ req: request } as never)).resolves.toBe(false)
  })

  it('requires the one-time setup secret for an empty production database', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('FIRST_USER_SETUP_SECRET', 'a'.repeat(32))
    vi.stubEnv('FIRST_USER_SETUP_EMAIL', 'first-admin@example.com')
    const request: {
      headers: Headers
      payload: { count: () => Promise<{ totalDocs: number }> }
      user: unknown
    } = {
      payload: { count: async () => ({ totalDocs: 0 }) },
      user: null,
      headers: new Headers(),
    }
    await expect(
      adminsOrFirstUser({ data: { email: 'first-admin@example.com' }, req: request } as never),
    ).resolves.toBe(false)
    request.headers.set('x-first-user-setup', 'a'.repeat(32))
    await expect(
      adminsOrFirstUser({ data: { email: 'wrong@example.com' }, req: request } as never),
    ).resolves.toBe(false)
    await expect(
      adminsOrFirstUser({ data: { email: 'first-admin@example.com' }, req: request } as never),
    ).resolves.toBe(true)
    vi.unstubAllEnvs()
  })

  it('rejects anonymous administrator creation after launch over REST', async () => {
    const email = `anonymous-admin-${Date.now()}@example.com`
    const response = await restPost(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'should-never-work', role: 'admin' }),
      }),
      { params: Promise.resolve({ slug: ['users'] }) },
    )

    expect(response.status).toBe(403)
    const users = await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(users.totalDocs).toBe(0)
  })

  it('reports a stale registration form as not found', async () => {
    const response = await restPost(
      new Request('http://localhost/api/activity-signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({
          email: 'stale@example.com',
          eventID: 2_147_483_647,
          locale: 'en',
          name: 'Stale Student',
        }),
      }),
      { params: Promise.resolve({ slug: ['activity-signup'] }) },
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: 'notFound' })
  })

  it('identifies each invalid public registration field', async () => {
    const response = await restPost(
      new Request('http://localhost/api/activity-signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ email: 'not-an-email', eventID: 1, locale: 'en', name: '' }),
      }),
      { params: Promise.resolve({ slug: ['activity-signup'] }) },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Check the form fields',
      fieldErrors: { email: 'emailInvalid', name: 'nameRequired' },
    })
  })

  it('protects Payload scheduled-job processing with its bearer secret', async () => {
    const secret = 'j'.repeat(32)
    vi.stubEnv('PAYLOAD_JOBS_SECRET', secret)
    const unauthorized = await restGet(
      new Request('http://localhost/api/payload-jobs/run', {
        headers: { authorization: 'Bearer invalid' },
      }),
      { params: Promise.resolve({ slug: ['payload-jobs', 'run'] }) },
    )
    const authorized = await restGet(
      new Request('http://localhost/api/payload-jobs/run?allQueues=true&limit=10', {
        headers: { authorization: `Bearer ${secret}` },
      }),
      { params: Promise.resolve({ slug: ['payload-jobs', 'run'] }) },
    )
    vi.unstubAllEnvs()

    expect(unauthorized.status).toBe(401)
    expect(authorized.status).toBe(200)
  })

  it('routes registration delivery processing outside the delivery collection', async () => {
    vi.stubEnv('REGISTRATION_DELIVERY_SECRET', 'd'.repeat(32))
    const response = await restPost(
      new Request('http://localhost/api/registration-delivery-process', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid' },
      }),
      { params: Promise.resolve({ slug: ['registration-delivery-process'] }) },
    )
    vi.unstubAllEnvs()

    expect(response.status).toBe(401)
  })

  it.each(['registrations', 'registration-deliveries'])(
    'denies public REST reads of %s',
    async (collection) => {
      const response = await restGet(new Request(`http://localhost/api/${collection}`), {
        params: Promise.resolve({ slug: [collection] }),
      })

      expect(response.status).toBe(403)
      const body = await response.text()
      expect(body).not.toContain('cancellationTokenHash')
      expect(body).not.toContain('encryptedPayload')
    },
  )

  it('denies public GraphQL reads of registrations and delivery secrets', async () => {
    const response = await graphqlPost(
      new Request('http://localhost/api/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `query PublicPrivateData {
          Registrations { docs { id email cancellationTokenHash } }
          RegistrationDeliveries { docs { id encryptedPayload } }
        }`,
        }),
      }),
    )
    const result = (await response.json()) as {
      data?: { Registrations?: unknown; RegistrationDeliveries?: unknown }
      errors?: Array<{ message: string }>
    }

    expect(response.status).toBe(200)
    expect(result.errors).toHaveLength(2)
    expect(result.data?.Registrations).toBeNull()
    expect(result.data?.RegistrationDeliveries).toBeNull()
    expect(JSON.stringify(result.data)).not.toContain('cancellationTokenHash')
    expect(JSON.stringify(result.data)).not.toContain('encryptedPayload')
  })
})
