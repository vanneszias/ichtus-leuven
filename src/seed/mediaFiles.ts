import path from 'node:path'

/**
 * Where the media binaries that the starter content needs are kept. They are
 * committed so `pnpm seed` can upload them into an empty database, and
 * `pnpm pull:staging` refreshes them from R2.
 */
export const SEED_MEDIA_DIRECTORY = path.join('public', 'photos')

export function seedMediaPath(filename: string): string {
  return path.resolve(process.cwd(), SEED_MEDIA_DIRECTORY, filename)
}

/** The media metadata the generated library carries for each file. */
export type SeedMediaEntry = {
  altEN?: string | null
  altNL?: string | null
  captionEN?: string | null
  captionNL?: string | null
  capturedAt?: string | null
  containsPeople?: boolean | null
  focalPosition?: { x?: number | null; y?: number | null } | null
  isDecorative?: boolean | null
  publicationConsent?: boolean | null
  source?: string | null
}
