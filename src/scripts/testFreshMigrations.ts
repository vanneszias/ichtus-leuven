import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const statePath = await mkdtemp(path.join(os.tmpdir(), 'ichtus-migrations-'))

try {
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn('pnpm', ['payload', 'migrate'], {
      env: {
        ...process.env,
        CLOUDFLARE_PERSIST_PATH: statePath,
        CLOUDFLARE_REMOTE: 'false',
        PAYLOAD_DB_PUSH: 'false',
        REFRESH_STARTER_CONTENT: 'overwrite-local-editorial-content',
      },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
  if (exitCode !== 0) process.exitCode = exitCode
} finally {
  await rm(statePath, { recursive: true, force: true })
}
