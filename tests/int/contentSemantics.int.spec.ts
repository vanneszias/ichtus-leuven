import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import {
  pageRichTextHeadingLevels,
  validatePageRichTextHeadings,
} from '../../src/blocks/schemaFields'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MEDIA_MAX_DIMENSION,
  MEDIA_MAX_FILE_SIZE,
  MEDIA_MAX_PIXELS,
  Media,
  validateMediaAlt,
  validateMediaUpload,
} from '../../src/collections/Media'
import { validateUniquePageAnchors } from '../../src/collections/Pages'

describe('semantic CMS validation', () => {
  it('rejects duplicate page anchors', () => {
    expect(
      validateUniquePageAnchors([
        { appearance: { anchor: 'agenda' } },
        { appearance: { anchor: 'vragen' } },
      ]),
    ).toBe(true)
    expect(
      validateUniquePageAnchors([
        { appearance: { anchor: 'agenda' } },
        { appearance: { anchor: 'agenda' } },
      ]),
    ).toContain('agenda')
  })

  it('requires localized alt for meaningful media and explicitly permits decorative media', () => {
    expect(validateMediaAlt('', { siblingData: { isDecorative: false } } as never)).toContain(
      'verplicht',
    )
    expect(
      validateMediaAlt('Studenten aan tafel', { siblingData: { isDecorative: false } } as never),
    ).toBe(true)
    expect(validateMediaAlt('', { siblingData: { isDecorative: true } } as never)).toBe(true)

    const decorativeField = Media.fields.find(
      (field) => 'name' in field && field.name === 'isDecorative',
    )
    const focalField = Media.fields.find(
      (field) => 'name' in field && field.name === 'focalPosition',
    )
    expect(decorativeField).toBeTruthy()
    expect(focalField).toBeTruthy()
  })

  it('enforces Cloudflare-safe image type, filesize, and dimension limits without Sharp', () => {
    expect(
      validateMediaUpload({
        mimeType: 'image/webp',
        filesize: MEDIA_MAX_FILE_SIZE,
        width: 5000,
        height: 4000,
      }),
    ).toBe(true)
    expect(
      validateMediaUpload({ mimeType: 'image/svg+xml', filesize: 1000, width: 100, height: 100 }),
    ).toContain('AVIF')
    expect(
      validateMediaUpload({
        mimeType: 'image/webp',
        filesize: MEDIA_MAX_FILE_SIZE + 1,
        width: 100,
        height: 100,
      }),
    ).toContain('MB')
    expect(
      validateMediaUpload({
        mimeType: 'image/webp',
        filesize: 1000,
        width: MEDIA_MAX_DIMENSION + 1,
        height: 100,
      }),
    ).toContain('8000px')
    expect(
      validateMediaUpload({
        mimeType: 'image/webp',
        filesize: 1000,
        width: MEDIA_MAX_PIXELS,
        height: 2,
      }),
    ).toContain('megapixel')
    expect(typeof Media.upload === 'object' && Media.upload.mimeTypes).toEqual(
      ALLOWED_IMAGE_MIME_TYPES,
    )
    expect(typeof Media.upload === 'object' && Media.upload.focalPoint).toBe(false)
  })

  it('allows only h3 and h4 inside section rich text', () => {
    expect(pageRichTextHeadingLevels).toEqual(['h3', 'h4'])
    expect(
      validatePageRichTextHeadings({ root: { children: [{ type: 'heading', tag: 'h3' }] } }),
    ).toBe(true)
    expect(
      validatePageRichTextHeadings({ root: { children: [{ type: 'heading', tag: 'h2' }] } }),
    ).toContain('kopniveau 3 of 4')
  })

  it('uses explicit locale fallback and bounded published caches while bypassing them for drafts', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/content.ts'), 'utf8')
    expect(source).toContain('fallbackLocale: false as const')
    expect(source).not.toContain("fallbackLocale: 'nl'")
    expect(source).toContain("unstable_cache(querySiteSettings, ['public-site-settings']")
    expect(source).toContain(
      'draft ? await queryPage(locale, slug, true) : await getCachedPage(locale, slug)',
    )
    expect(source).toContain('events: 60')
    expect(source).toContain('settings: 300')
  })
})
