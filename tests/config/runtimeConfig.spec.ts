import { describe, expect, it } from 'vitest'

import { validateRuntimeConfiguration } from '@/lib/runtimeConfig'
import { assertRemoteEmptySeedAllowed, assertStarterRefreshAllowed } from '@/seed/safety'

const validEnvironment = {
  PAYLOAD_SECRET: 'p'.repeat(32),
  NEXT_PUBLIC_SITE_URL: 'https://staging.example.org',
  EMAIL_FROM_ADDRESS: 'hello@example.org',
  EMAIL_REPLY_TO: 'reply@example.org',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
  TURNSTILE_SECRET_KEY: 't'.repeat(20),
  REGISTRATION_CLEANUP_SECRET: 'c'.repeat(32),
  REGISTRATION_DELIVERY_KEY: 'a'.repeat(64),
  REGISTRATION_DELIVERY_SECRET: 'd'.repeat(32),
  GOOGLE_CALENDAR_ID: 'calendar@example.org',
  GOOGLE_CALENDAR_API_KEY: 'calendar-key',
  CALENDAR_SYNC_SECRET: 's'.repeat(32),
  PAYLOAD_JOBS_SECRET: 'j'.repeat(32),
  REGISTRATION_DELIVERY_SCHEDULE: '*/5 * * * *',
  REGISTRATION_CLEANUP_SCHEDULE: '*/5 * * * *',
  CALENDAR_SYNC_SCHEDULE: '0 * * * *',
  PAYLOAD_JOBS_SCHEDULE: '* * * * *',
  MONITORING_HEALTHCHECK_URL: 'https://monitor.example.org/health',
  FONT_PRODUCTION_LICENSE_CONFIRMED: 'true',
}

describe('runtime configuration', () => {
  it('accepts a complete deployment configuration', () => {
    expect(validateRuntimeConfiguration(validEnvironment)).toEqual([])
  })

  it('rejects unsafe URLs and malformed encryption keys', () => {
    const failures = validateRuntimeConfiguration({
      ...validEnvironment,
      NEXT_PUBLIC_SITE_URL: 'http://example.org',
      REGISTRATION_DELIVERY_KEY: 'not-a-key',
    })
    expect(failures).toContain('NEXT_PUBLIC_SITE_URL must use HTTPS')
    expect(failures).toContain('REGISTRATION_DELIVERY_KEY must contain 64 hexadecimal characters')
  })

  it('rejects schedules that differ from the deployed scheduler cadence', () => {
    const failures = validateRuntimeConfiguration({
      ...validEnvironment,
      REGISTRATION_CLEANUP_SCHEDULE: '0 3 1 * *',
    })
    expect(failures).toContain(
      'REGISTRATION_CLEANUP_SCHEDULE must equal the deployed schedule */5 * * * *',
    )
  })
})

describe('seed safety', () => {
  it('rejects any seed over editorial content', () => {
    expect(() =>
      assertRemoteEmptySeedAllowed({
        environment: 'staging',
        pageCount: 1,
        remote: true,
        settingsPopulated: false,
        confirmation: 'staging',
      }),
    ).toThrow('editorial content')
  })

  it('requires the selected environment as remote empty-database confirmation', () => {
    expect(() =>
      assertRemoteEmptySeedAllowed({
        environment: 'production',
        pageCount: 0,
        remote: true,
        settingsPopulated: false,
        confirmation: 'staging',
      }),
    ).toThrow('SEED_EMPTY_DATABASE=production')
  })

  it('forbids remote starter refreshes even when confirmed', () => {
    expect(() =>
      assertStarterRefreshAllowed({
        CLOUDFLARE_REMOTE: 'true',
        REFRESH_STARTER_CONTENT: 'overwrite-local-editorial-content',
      }),
    ).toThrow('forbidden')
  })
})
