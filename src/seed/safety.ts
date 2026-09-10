import type { DeploymentEnvironment } from '@/lib/runtimeConfig'

export function assertRemoteEmptySeedAllowed(input: {
  environment?: string
  pageCount: number
  remote: boolean
  settingsPopulated: boolean
  confirmation?: string
}) {
  if (input.pageCount > 0 || input.settingsPopulated) {
    throw new Error('Seed stopped: Pages or Site Settings already contain editorial content')
  }
  if (!input.remote) return
  if (!['staging', 'production'].includes(input.environment || '')) {
    throw new Error('Remote seed requires CLOUDFLARE_ENV=staging or production')
  }
  if (input.confirmation !== input.environment) {
    throw new Error(`Remote seed requires SEED_EMPTY_DATABASE=${input.environment}`)
  }
}

export function assertStarterRefreshAllowed(env: Record<string, string | undefined> = process.env) {
  if (env.CLOUDFLARE_REMOTE === 'true')
    throw new Error('Starter content refresh is forbidden for remote bindings')
  if (env.REFRESH_STARTER_CONTENT !== 'overwrite-local-editorial-content') {
    throw new Error(
      'Set REFRESH_STARTER_CONTENT=overwrite-local-editorial-content to refresh local starter layouts',
    )
  }
}

export function deploymentEnvironment(
  value: string | undefined,
): DeploymentEnvironment | undefined {
  return value === 'staging' || value === 'production' ? value : undefined
}
