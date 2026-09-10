import { spawn } from 'node:child_process'

import { deploymentEnvironments, runtimeConfiguration } from '@/lib/runtimeConfig'

const environment = process.env.CLOUDFLARE_ENV
if (!deploymentEnvironments.includes(environment as 'staging' | 'production')) {
  throw new Error('CLOUDFLARE_ENV must be staging or production')
}

// This key is provisioned separately so an ordinary deploy cannot invalidate queued payloads.
const names = [
  ...Object.keys(runtimeConfiguration).filter((name) => name !== 'REGISTRATION_DELIVERY_KEY'),
  'EMAIL_FROM_NAME',
  'PAYLOAD_LOG_LEVEL',
]
const values = Object.fromEntries(
  names.flatMap((name) => {
    const value = process.env[name]?.trim()
    return value ? [[name, value]] : []
  }),
)

const child = spawn('pnpm', ['exec', 'wrangler', 'secret', 'bulk', '--env', environment], {
  stdio: ['pipe', 'inherit', 'inherit'],
})
child.stdin.end(JSON.stringify(values))

const exitCode = await new Promise<number>((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', (code) => resolve(code ?? 1))
})
if (exitCode !== 0) {
  process.exitCode = exitCode
} else {
  const list = spawn(
    'pnpm',
    ['exec', 'wrangler', 'secret', 'list', '--env', environment, '--format', 'json'],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  )
  let output = ''
  list.stdout.on('data', (chunk) => {
    output += String(chunk)
  })
  const listExitCode = await new Promise<number>((resolve, reject) => {
    list.once('error', reject)
    list.once('exit', (code) => resolve(code ?? 1))
  })
  if (listExitCode !== 0) {
    process.exitCode = listExitCode
  } else {
    const secrets = JSON.parse(output) as Array<{ name: string }>
    if (!secrets.some(({ name }) => name === 'REGISTRATION_DELIVERY_KEY')) {
      const deliveryKey = process.env.REGISTRATION_DELIVERY_KEY?.trim()
      if (!deliveryKey)
        throw new Error('REGISTRATION_DELIVERY_KEY is required for first deployment')
      const put = spawn(
        'pnpm',
        ['exec', 'wrangler', 'secret', 'put', 'REGISTRATION_DELIVERY_KEY', '--env', environment],
        { stdio: ['pipe', 'inherit', 'inherit'] },
      )
      put.stdin.end(deliveryKey)
      const putExitCode = await new Promise<number>((resolve, reject) => {
        put.once('error', reject)
        put.once('exit', (code) => resolve(code ?? 1))
      })
      if (putExitCode !== 0) process.exitCode = putExitCode
    }
  }
}
