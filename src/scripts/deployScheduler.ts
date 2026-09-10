import { spawn } from 'node:child_process'

import { deploymentEnvironments } from '@/lib/runtimeConfig'

const environment = process.env.CLOUDFLARE_ENV
if (!deploymentEnvironments.includes(environment as 'staging' | 'production'))
  throw new Error('CLOUDFLARE_ENV must be staging or production')

const values = Object.fromEntries(
  [
    'CALENDAR_SYNC_SECRET',
    'PAYLOAD_JOBS_SECRET',
    'REGISTRATION_CLEANUP_SECRET',
    'REGISTRATION_DELIVERY_SECRET',
  ].map((name) => {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`${name} is required`)
    return [name, value]
  }),
)

async function run(args: string[], input?: string) {
  const child = spawn('pnpm', ['exec', 'wrangler', ...args], {
    stdio: [input ? 'pipe' : 'inherit', 'inherit', 'inherit'],
  })
  if (input) child.stdin.end(input)
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
  if (exitCode !== 0) throw new Error(`wrangler ${args[0]} failed`)
}

const config = 'workers/scheduler/wrangler.jsonc'
await run(['deploy', '--config', config, '--env', environment])
await run(['secret', 'bulk', '--config', config, '--env', environment], JSON.stringify(values))
