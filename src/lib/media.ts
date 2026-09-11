import { type DeploymentEnvironment, deploymentEnvironments, siteURL } from '@/lib/runtimeConfig'
import type { Media } from '@/payload-types'

// Payload serves uploads from this dynamic route, backed by R2. Curated assets
// under /photos and /logos are ordinary static files and never match.
const PAYLOAD_FILE_PREFIX = '/api/media/file/'

type Environment = Record<string, string | undefined>

export type MediaSourceInput = Pick<Media, 'updatedAt' | 'url'>

// Filenames are not content-hashed, so a replaced upload would otherwise keep
// its URL. Deriving the token from updatedAt changes the URL whenever the bytes
// can have changed, which is what makes the immutable cache header on the file
// route safe (see Media.upload.modifyResponseHeaders).
function versionToken(updatedAt: string | undefined) {
  const parsed = updatedAt ? Date.parse(updatedAt) : Number.NaN
  return Number.isNaN(parsed) ? '0' : parsed.toString(36)
}

function isDeployed(env: Environment) {
  return deploymentEnvironments.includes(env.APP_ENV as DeploymentEnvironment)
}

/**
 * Resolves the `src` to hand to `next/image` for a CMS upload.
 *
 * Deployed, the source has to be absolute: the OpenNext optimizer resolves
 * relative sources through the static-assets binding (`env.ASSETS`), which
 * cannot see objects Payload streams out of R2, and answers 404. Absolute
 * sources take its remote-fetch branch instead, which works because the
 * `global_fetch_strictly_public` compatibility flag lets the Worker call its own
 * public hostname.
 *
 * Locally, `next dev` and `next start` use Next's own optimizer, which fetches
 * relative sources internally and rejects absolute loopback ones outright
 * (`dangerouslyAllowLocalIP` defaults to false). So the relative form is both
 * required and faster there. The discriminator is APP_ENV rather than
 * NEXT_PUBLIC_SITE_URL because .env.example points the latter at localhost.
 */
export function mediaSource(media: MediaSourceInput, env: Environment = process.env) {
  const { url } = media
  if (!url) return null
  if (!url.startsWith(PAYLOAD_FILE_PREFIX)) return url
  const versioned = `${url}?v=${versionToken(media.updatedAt)}`
  return isDeployed(env) ? `${siteURL(env)}${versioned}` : versioned
}
