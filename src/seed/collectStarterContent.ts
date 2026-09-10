import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { PageLocaleInput, SerializeResult } from '@/seed/codegen'
import {
  indexModule,
  mediaModule,
  moduleFilename,
  pageModule,
  serialize,
  siteSettingsModule,
} from '@/seed/codegen'
import type { SeedMediaEntry } from '@/seed/mediaFiles'
import type { StarterLocale } from '@/seed/starterContent'

const LOCALES: StarterLocale[] = ['nl', 'en']

/** Deep enough to populate uploads and links nested inside blocks. */
const POPULATE_DEPTH = 2

const OUTPUT_DIRECTORY = path.join('src', 'seed', 'starter')

export type StarterContentReport = {
  files: string[]
  media: string[]
  pages: { key: string; slugs: string[] }[]
  warnings: string[]
}

type LocalizedPage = {
  layout?: unknown
  navigationLabel?: string | null
  navigationOrder?: number | null
  parent?: unknown
  sectionTitle?: string | null
  seo?: unknown
  slug?: string | null
  title?: string | null
}

function parentSlug(parent: unknown): string | null {
  if (!parent || typeof parent !== 'object') return null
  const slug = (parent as { slug?: unknown }).slug
  return typeof slug === 'string' ? slug : null
}

async function readMediaEntry(
  payload: Payload,
  filename: string,
  warnings: string[],
): Promise<SeedMediaEntry | undefined> {
  const documents = await Promise.all(
    LOCALES.map(async (locale) => {
      const result = await payload.find({
        collection: 'media',
        depth: 0,
        fallbackLocale: false,
        limit: 1,
        locale,
        overrideAccess: true,
        where: { filename: { equals: filename } },
      })
      return result.docs[0]
    }),
  )

  const [dutch, english] = documents
  if (!dutch) {
    warnings.push(`Media ${filename} is referenced by a page but missing from the media library`)
    return undefined
  }

  if (!dutch.isDecorative && !dutch.alt) {
    warnings.push(`Media ${filename} has no Dutch description, so seeding it will fail validation`)
  }

  return {
    altEN: english?.alt ?? null,
    altNL: dutch.alt ?? null,
    captionEN: english?.caption ?? null,
    captionNL: dutch.caption ?? null,
    capturedAt: dutch.capturedAt ?? null,
    containsPeople: dutch.containsPeople ?? null,
    focalPosition: dutch.focalPosition ?? null,
    isDecorative: dutch.isDecorative ?? null,
    publicationConsent: dutch.publicationConsent ?? null,
    source: dutch.source ?? null,
  }
}

/**
 * Reads the published content out of the database Payload is connected to and
 * rewrites `src/seed/starter` so that `pnpm seed` reproduces it.
 */
export async function writeStarterContent(
  payload: Payload,
  rootDirectory = process.cwd(),
): Promise<StarterContentReport> {
  const warnings: string[] = []
  const mediaFilenames = new Set<string>()

  const published = await payload.find({
    collection: 'pages',
    depth: 0,
    draft: false,
    locale: 'nl',
    overrideAccess: true,
    pagination: false,
    sort: 'id',
  })

  const modules: { exportName: string; filename: string; source: string }[] = []
  const pages: StarterContentReport['pages'] = []

  for (const summary of published.docs) {
    const locales: Record<string, PageLocaleInput> = {}
    let navigationOrder: number | null = null
    let parent: string | null = null

    for (const locale of LOCALES) {
      const document = (await payload.findByID({
        collection: 'pages',
        id: summary.id,
        depth: POPULATE_DEPTH,
        draft: false,
        fallbackLocale: false,
        locale,
        overrideAccess: true,
      })) as LocalizedPage

      if (!document.slug || !document.title) {
        warnings.push(`Page ${summary.id} has no ${locale} translation and was skipped`)
        continue
      }

      const layout = serialize(document.layout ?? [], `${document.slug}.layout`)
      const seo = document.seo ? serialize(document.seo, `${document.slug}.seo`) : undefined
      for (const filename of [...layout.media, ...(seo?.media ?? [])]) {
        mediaFilenames.add(filename)
      }
      warnings.push(...layout.warnings)

      locales[locale] = {
        layout,
        navigationLabel: document.navigationLabel ?? null,
        sectionTitle: document.sectionTitle ?? null,
        seo: document.seo ?? undefined,
        slug: document.slug,
        title: document.title,
      }

      navigationOrder = document.navigationOrder ?? navigationOrder
      parent = parentSlug(document.parent) ?? parent
    }

    if (!locales.nl) {
      warnings.push(`Page ${summary.id} has no Dutch translation and was not generated`)
      continue
    }

    const key = locales.nl.slug
    const { exportName, source } = pageModule({
      key,
      locales,
      navigationOrder,
      parentSlug: parent,
    })
    modules.push({ exportName, filename: moduleFilename(key), source })
    pages.push({
      key,
      slugs: LOCALES.map((locale) => locales[locale]?.slug).filter(Boolean) as string[],
    })
  }

  const settings: Record<string, SerializeResult> = {}
  for (const locale of LOCALES) {
    const document = await payload.findGlobal({
      slug: 'site-settings',
      depth: POPULATE_DEPTH,
      fallbackLocale: false,
      locale,
      overrideAccess: true,
    })
    const result = serialize(document, `site-settings.${locale}`)
    for (const filename of result.media) mediaFilenames.add(filename)
    warnings.push(...result.warnings)
    settings[locale] = result
  }

  const library = new Map<string, SeedMediaEntry>()
  for (const filename of [...mediaFilenames].sort()) {
    const entry = await readMediaEntry(payload, filename, warnings)
    if (entry) library.set(filename, entry)
  }

  const outputDirectory = path.join(rootDirectory, OUTPUT_DIRECTORY)
  const pagesDirectory = path.join(outputDirectory, 'pages')
  await mkdir(pagesDirectory, { recursive: true })

  const files: string[] = []
  const write = async (filePath: string, contents: string) => {
    await writeFile(filePath, contents, 'utf8')
    files.push(path.relative(rootDirectory, filePath))
  }

  await write(path.join(outputDirectory, 'media.ts'), mediaModule(library))
  for (const module of modules) {
    await write(path.join(pagesDirectory, `${module.filename}.ts`), module.source)
  }
  await write(path.join(outputDirectory, 'siteSettings.ts'), siteSettingsModule(settings))
  await write(
    path.join(outputDirectory, 'index.ts'),
    indexModule(modules.map(({ exportName, filename }) => ({ exportName, filename }))),
  )

  const expected = new Set(modules.map((module) => `${module.filename}.ts`))
  for (const entry of await readdir(pagesDirectory)) {
    if (expected.has(entry)) continue
    await rm(path.join(pagesDirectory, entry))
    warnings.push(`Removed ${path.join('pages', entry)}, which no longer exists on Cloudflare`)
  }

  return { files, media: [...library.keys()], pages, warnings }
}
