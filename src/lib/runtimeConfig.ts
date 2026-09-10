const DEVELOPMENT_SITE_URL = 'http://localhost:3000'

export const deploymentEnvironments = ['staging', 'production'] as const
export type DeploymentEnvironment = (typeof deploymentEnvironments)[number]

type RuntimeVariableRule = {
  deployRequired?: boolean
  minLength?: number
  validate?: (value: string) => string | undefined
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function httpsURL(value: string) {
  try {
    return new URL(value).protocol === 'https:' ? undefined : 'must use HTTPS'
  } catch {
    return 'must be a valid URL'
  }
}

function exactSchedule(expected: string) {
  return (value: string) =>
    value.trim() === expected ? undefined : `must equal the deployed schedule ${expected}`
}

export const runtimeConfiguration = {
  PAYLOAD_SECRET: { deployRequired: true, minLength: 32 },
  NEXT_PUBLIC_SITE_URL: { deployRequired: true, validate: httpsURL },
  EMAIL_FROM_ADDRESS: {
    deployRequired: true,
    validate: (value) => (emailPattern.test(value) ? undefined : 'must be a valid email address'),
  },
  EMAIL_REPLY_TO: {
    deployRequired: true,
    validate: (value) => (emailPattern.test(value) ? undefined : 'must be a valid email address'),
  },
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: { deployRequired: true },
  TURNSTILE_SECRET_KEY: { deployRequired: true, minLength: 20 },
  REGISTRATION_CLEANUP_SECRET: { deployRequired: true, minLength: 32 },
  REGISTRATION_DELIVERY_KEY: {
    deployRequired: true,
    validate: (value) =>
      /^[a-f0-9]{64}$/i.test(value) ? undefined : 'must contain 64 hexadecimal characters',
  },
  REGISTRATION_DELIVERY_SECRET: { deployRequired: true, minLength: 32 },
  GOOGLE_CALENDAR_ID: { deployRequired: true },
  GOOGLE_CALENDAR_API_KEY: { deployRequired: true },
  CALENDAR_SYNC_SECRET: { deployRequired: true, minLength: 32 },
  PAYLOAD_JOBS_SECRET: { deployRequired: true, minLength: 32 },
  REGISTRATION_DELIVERY_SCHEDULE: { deployRequired: true, validate: exactSchedule('*/5 * * * *') },
  REGISTRATION_CLEANUP_SCHEDULE: { deployRequired: true, validate: exactSchedule('*/5 * * * *') },
  CALENDAR_SYNC_SCHEDULE: { deployRequired: true, validate: exactSchedule('0 * * * *') },
  PAYLOAD_JOBS_SCHEDULE: { deployRequired: true, validate: exactSchedule('* * * * *') },
  MONITORING_HEALTHCHECK_URL: { validate: httpsURL },
  FONT_PRODUCTION_LICENSE_CONFIRMED: {
    deployRequired: true,
    validate: (value) =>
      value === 'true' ? undefined : 'must be true after production usage rights are documented',
  },
} as const satisfies Record<string, RuntimeVariableRule>

export type RuntimeVariableName = keyof typeof runtimeConfiguration

export function runtimeValue(
  name: RuntimeVariableName,
  env: Record<string, string | undefined> = process.env,
) {
  return env[name]?.trim()
}

export function validateRuntimeConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const failures: string[] = []
  for (const [name, configuredRule] of Object.entries(runtimeConfiguration)) {
    const rule: RuntimeVariableRule = configuredRule
    const configured = env[name]?.trim()
    if (rule.deployRequired && !configured) {
      failures.push(`${name} is missing`)
      continue
    }
    if (!configured) continue
    if (rule.minLength && configured.length < rule.minLength)
      failures.push(`${name} must be at least ${rule.minLength} characters`)
    const invalid = rule.validate?.(configured)
    if (invalid) failures.push(`${name} ${invalid}`)
  }
  return failures
}

function required(name: RuntimeVariableName) {
  const configured = runtimeValue(name)
  if (!configured) throw new Error(`${name} is required`)
  return configured
}

export function siteURL() {
  const configured = runtimeValue('NEXT_PUBLIC_SITE_URL')
  const url = new URL(configured || DEVELOPMENT_SITE_URL)
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
  return url.origin
}

export function payloadSecret() {
  const secret = runtimeValue('PAYLOAD_SECRET')
  if (secret) return secret
  if (process.env.NODE_ENV === 'production')
    throw new Error('PAYLOAD_SECRET is required in production')
  return 'local-development-only-payload-secret'
}

export function emailConfig() {
  return {
    fromAddress: required('EMAIL_FROM_ADDRESS'),
    fromName: process.env.EMAIL_FROM_NAME?.trim() || 'Ichtus Leuven',
    replyTo: runtimeValue('EMAIL_REPLY_TO'),
  }
}

export function turnstileSiteKey() {
  return runtimeValue('NEXT_PUBLIC_TURNSTILE_SITE_KEY')
}

export function requiredSecret(
  name:
    | 'CALENDAR_SYNC_SECRET'
    | 'PAYLOAD_JOBS_SECRET'
    | 'REGISTRATION_CLEANUP_SECRET'
    | 'REGISTRATION_DELIVERY_SECRET',
) {
  return required(name)
}

export function calendarConfig() {
  return { apiKey: required('GOOGLE_CALENDAR_API_KEY'), calendarID: required('GOOGLE_CALENDAR_ID') }
}
