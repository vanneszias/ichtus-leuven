import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'

import {
  type DeploymentEnvironment,
  deploymentEnvironments,
  validateRuntimeConfiguration,
} from '@/lib/runtimeConfig'

type WranglerEnvironment = {
  name?: string
  vars?: { APP_ENV?: string }
  d1_databases?: Array<{
    binding?: string
    database_id?: string
    database_name?: string
    remote?: boolean
  }>
  r2_buckets?: Array<{ binding?: string; bucket_name?: string; remote?: boolean }>
  send_email?: Array<{ name?: string }>
}

type WranglerConfig = { env?: Record<string, WranglerEnvironment>; keep_vars?: boolean }

function selectedEnvironment(): DeploymentEnvironment | undefined {
  const argument = process.argv.find((value) => value.startsWith('--env='))?.slice('--env='.length)
  const index = process.argv.indexOf('--env')
  const value =
    argument || (index >= 0 ? process.argv[index + 1] : undefined) || process.env.CLOUDFLARE_ENV
  return deploymentEnvironments.find((environment) => environment === value)
}

function parseJSONC(contents: string): WranglerConfig {
  const withoutComments = contents.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(withoutComments) as WranglerConfig
}

const failures = validateRuntimeConfiguration()
const environment = selectedEnvironment()

if (!environment) failures.push('Select --env=staging or --env=production')
if (process.env.CLOUDFLARE_ENV && environment && process.env.CLOUDFLARE_ENV !== environment) {
  failures.push(`CLOUDFLARE_ENV=${process.env.CLOUDFLARE_ENV} does not match --env=${environment}`)
}
if (process.env.CLOUDFLARE_REMOTE !== 'true')
  failures.push('CLOUDFLARE_REMOTE must be true for deployment preflight')

const wranglerPath = path.resolve('wrangler.jsonc')
let wrangler: WranglerConfig = {}
try {
  wrangler = parseJSONC(fs.readFileSync(wranglerPath, 'utf8'))
} catch (error) {
  failures.push(
    `wrangler.jsonc could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
  )
}

for (const name of deploymentEnvironments) {
  const configured = wrangler.env?.[name]
  if (!configured) {
    failures.push(`wrangler.jsonc is missing env.${name}`)
    continue
  }
  if (configured.vars?.APP_ENV !== name)
    failures.push(`env.${name}.vars.APP_ENV must equal ${name}`)
  const database = configured.d1_databases?.find((binding) => binding.binding === 'D1')
  const bucket = configured.r2_buckets?.find((binding) => binding.binding === 'R2')
  if (!database) failures.push(`env.${name} is missing the D1 binding`)
  if (!database?.database_name) failures.push(`env.${name} D1 database_name is missing`)
  if (database?.remote !== true) failures.push(`env.${name} D1 binding must use remote resources`)
  if (
    name === environment &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      database?.database_id || '',
    )
  ) {
    failures.push(`env.${name} D1 database_id must be replaced with its real Cloudflare UUID`)
  }
  if (!bucket?.bucket_name) failures.push(`env.${name} is missing the R2 binding`)
  if (bucket?.remote !== true) failures.push(`env.${name} R2 binding must use remote resources`)
  if (!configured.send_email?.some((binding) => binding.name === 'EMAIL'))
    failures.push(`env.${name} is missing the EMAIL binding`)
}

if (wrangler.keep_vars !== true)
  failures.push('wrangler.jsonc keep_vars must be true to preserve dashboard bindings')

const staging = wrangler.env?.staging
const production = wrangler.env?.production
const isolatedValues = [
  ['Worker name', staging?.name, production?.name],
  [
    'D1 database name',
    staging?.d1_databases?.[0]?.database_name,
    production?.d1_databases?.[0]?.database_name,
  ],
  [
    'D1 database ID',
    staging?.d1_databases?.[0]?.database_id,
    production?.d1_databases?.[0]?.database_id,
  ],
  ['R2 bucket', staging?.r2_buckets?.[0]?.bucket_name, production?.r2_buckets?.[0]?.bucket_name],
] as const
for (const [label, stagingValue, productionValue] of isolatedValues) {
  if (stagingValue && stagingValue === productionValue)
    failures.push(`${label} must differ between staging and production`)
}

const siteURL = process.env.NEXT_PUBLIC_SITE_URL
if (siteURL) {
  try {
    const hostname = new URL(siteURL).hostname
    if (hostname === 'localhost' || hostname.endsWith('.invalid'))
      failures.push('NEXT_PUBLIC_SITE_URL must be a deployed hostname')
  } catch {
    // The authoritative runtime validation already reports malformed URLs.
  }
}

if (failures.length) {
  console.error(
    `${environment ? `${environment} deployment` : 'Deployment'} preflight failed:\n- ${failures.join('\n- ')}`,
  )
  process.exit(1)
}

console.log(`${environment} deployment preflight passed`)
