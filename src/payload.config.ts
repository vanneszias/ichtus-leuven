import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { buildConfig, type Payload } from 'payload'
import type { GetPlatformProxyOptions } from 'wrangler'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { RegistrationDeliveries } from './collections/RegistrationDeliveries'
import { Registrations } from './collections/Registrations'
import { ShortLinkClicks } from './collections/ShortLinkClicks'
import { ShortLinks } from './collections/ShortLinks'
import { Users } from './collections/Users'
import { calendarSync } from './endpoints/calendarSync'
import { health } from './endpoints/health'
import {
  registrationCancel,
  registrationCleanup,
  registrationDeliveries,
  registrationExport,
  registrationResend,
  registrationSignup,
} from './endpoints/registrations'
import { SiteSettings } from './globals/SiteSettings'
import { payloadSecret, requiredSecret } from './lib/runtimeConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => {
  try {
    return fs.existsSync(value) ? fs.realpathSync(value) : undefined
  } catch {
    return undefined
  }
}

const isCLI = process.argv.some((value) => {
  const resolved = realpath(value)
  if (!resolved) return false
  return (
    resolved.endsWith(path.join('payload', 'bin.js')) ||
    resolved.endsWith(path.join('next', 'dist', 'bin', 'next'))
  )
})
const isProduction = process.env.NODE_ENV === 'production'
const globalForCloudflare = globalThis as typeof globalThis & {
  __ichtusCloudflareContext?: Promise<CloudflareContext>
}

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as unknown as Payload['logger']

globalForCloudflare.__ichtusCloudflareContext ??=
  isCLI || !isProduction
    ? getCloudflareContextFromWrangler()
    : getCloudflareContext({ async: true })
const cloudflare = await globalForCloudflare.__ichtusCloudflareContext

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Ichtus Leuven',
    },
  },
  collections: [
    Pages,
    Events,
    Registrations,
    RegistrationDeliveries,
    ShortLinks,
    ShortLinkClicks,
    Media,
    Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  endpoints: [
    health,
    calendarSync,
    registrationSignup,
    registrationCancel,
    registrationExport,
    registrationResend,
    registrationCleanup,
    registrationDeliveries,
  ],
  jobs: {
    access: {
      run: ({ req }) => {
        try {
          return (
            req.headers.get('authorization') === `Bearer ${requiredSecret('PAYLOAD_JOBS_SECRET')}`
          )
        } catch {
          return false
        }
      },
    },
  },
  localization: {
    locales: [
      { label: 'Nederlands', code: 'nl' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'nl',
    fallback: true,
  },
  secret: payloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  globalForCloudflare.__ichtusCloudflareContext ??= import(
    /* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`
  ).then(({ getPlatformProxy }) =>
    getPlatformProxy({
      environment: process.env.CLOUDFLARE_ENV,
      persist: process.env.CLOUDFLARE_PERSIST_PATH
        ? { path: process.env.CLOUDFLARE_PERSIST_PATH }
        : true,
      remoteBindings: process.env.CLOUDFLARE_REMOTE === 'true',
    } satisfies GetPlatformProxyOptions),
  )

  return globalForCloudflare.__ichtusCloudflareContext
}
