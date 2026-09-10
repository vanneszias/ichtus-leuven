import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { aboutLayout } from '@/seed/about'
import { homeLayoutEN, homeLayoutNL } from '@/seed/home'

const retiredSlugs = ['over-ons/wie-we-zijn', 'over-ons/wat-we-doen', 'over-ons/geschiedenis']

function initialHomeLayout(locale: 'nl' | 'en') {
  const layout = locale === 'nl' ? homeLayoutNL : homeLayoutEN
  return layout.map((block) => {
    if (block.blockType !== 'photoStory') return block

    return {
      blockType: 'content' as const,
      heading: locale === 'nl' ? 'God, elkaar en de wereld om ons heen.' : 'God, one another and the world around us.',
      layout: 'split' as const,
      items: (locale === 'nl'
        ? ['gezamenlijke avonden', 'kleine kringen', 'WILD-avonden', 'lezingen en aanbidding']
        : ['shared evenings', 'small groups', 'WILD evenings', 'talks and worship']
      ).map((label) => ({ label })),
      appearance: block.appearance,
    }
  })
}

function initialAboutLayout(locale: 'nl' | 'en') {
  return aboutLayout(locale, { photos: false }).map((block) => {
    if (block.blockType !== 'networkLinks') return block

    return {
      blockType: 'content' as const,
      heading: block.heading,
      items: block.items.map(({ name }) => ({ label: name })),
      layout: 'split' as const,
      appearance: block.appearance,
    }
  })
}

async function pageByDutchSlug(payload: MigrateUpArgs['payload'], slug: string) {
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    fallbackLocale: false,
    limit: 1,
    locale: 'nl',
    overrideAccess: true,
    where: { slug: { equals: slug } },
  })
  return result.docs[0]
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const [about, home] = await Promise.all([
    pageByDutchSlug(payload, 'over-ons'),
    pageByDutchSlug(payload, 'home'),
  ])
  if (home) {
    await payload.update({
      collection: 'pages',
      id: home.id,
      locale: 'nl',
      overrideAccess: true,
      req,
      data: { layout: initialHomeLayout('nl'), _status: 'published' },
    })
    await payload.update({
      collection: 'pages',
      id: home.id,
      locale: 'en',
      overrideAccess: true,
      req,
      data: { layout: initialHomeLayout('en'), _status: 'published' },
    })
  }
  if (!about) return

  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'nl',
    overrideAccess: true,
    req,
    data: {
      layout: initialAboutLayout('nl'),
      navigationLabel: null,
      sectionTitle: null,
      seo: {
        description: 'Leer Ichtus Leuven kennen: wie we zijn, wat we doen en wat we geloven.',
        title: 'Over ons',
      },
      _status: 'published',
    },
  })
  await payload.update({
    collection: 'pages',
    id: about.id,
    locale: 'en',
    overrideAccess: true,
    req,
    data: {
      layout: initialAboutLayout('en'),
      navigationLabel: null,
      sectionTitle: null,
      seo: {
        description: 'Get to know Ichtus Leuven: who we are, what we do and what we believe.',
        title: 'About us',
      },
      _status: 'published',
    },
  })

  const retiredPages = await Promise.all(retiredSlugs.map((slug) => pageByDutchSlug(payload, slug)))
  await Promise.all(
    retiredPages.filter(Boolean).map((page) =>
      payload.update({
        collection: 'pages',
        id: page!.id,
        overrideAccess: true,
        req,
        data: { _status: 'draft', parent: null },
      }),
    ),
  )
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const about = await pageByDutchSlug(payload, 'over-ons')
  if (!about) return

  const retiredPages = await Promise.all(retiredSlugs.map((slug) => pageByDutchSlug(payload, slug)))
  await Promise.all(
    retiredPages.filter(Boolean).map((page, index) =>
      payload.update({
        collection: 'pages',
        id: page!.id,
        overrideAccess: true,
        req,
        data: {
          _status: 'published',
          navigationOrder: index + 1,
          parent: about.id,
        },
      }),
    ),
  )
}
