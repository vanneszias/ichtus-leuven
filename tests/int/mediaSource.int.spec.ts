import { describe, expect, it } from 'vitest'

import { mediaSource } from '@/lib/media'
import type { Media } from '@/payload-types'

const upload = {
  updatedAt: new Date(0).toISOString(),
  url: '/api/media/file/community.webp',
} satisfies Pick<Media, 'updatedAt' | 'url'>

describe('mediaSource', () => {
  it('keeps CMS uploads relative outside a Cloudflare deployment', () => {
    // next dev and next start resolve relative sources internally and reject
    // absolute loopback ones, so this is the only form that works locally.
    expect(mediaSource(upload, {})).toBe('/api/media/file/community.webp?v=0')
    expect(mediaSource(upload, { APP_ENV: 'test' })).toBe('/api/media/file/community.webp?v=0')
  })

  it('absolutizes CMS uploads on staging and production', () => {
    // The OpenNext optimizer resolves a relative source through the static
    // assets binding, which cannot see R2. Only the absolute form reaches it.
    const env = { APP_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://www.ichtusleuven.be' }
    expect(mediaSource(upload, env)).toBe(
      'https://www.ichtusleuven.be/api/media/file/community.webp?v=0',
    )
  })

  it('versions the URL by updatedAt so the immutable file header stays safe', () => {
    const later = mediaSource({ ...upload, updatedAt: new Date(86_400_000).toISOString() }, {})
    expect(later).not.toBe(mediaSource(upload, {}))
    expect(mediaSource({ ...upload, updatedAt: 'not a date' }, {})).toContain('?v=0')
  })

  it('leaves curated static assets untouched and drops media without a file', () => {
    // /photos and /logos are ordinary build assets the optimizer can already read.
    expect(
      mediaSource({ updatedAt: upload.updatedAt, url: '/photos/community-park.webp' }, {}),
    ).toBe('/photos/community-park.webp')
    expect(mediaSource({ updatedAt: upload.updatedAt, url: null }, {})).toBeNull()
  })
})
