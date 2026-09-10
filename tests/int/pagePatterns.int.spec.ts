import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { type PagePatternRenderProps, pagePatterns } from '../../src/blocks'
import { BlockRenderer } from '../../src/components/blocks/BlockRenderer'
import { EventCalendar } from '../../src/components/blocks/EventCalendar'
import { ResponsiveMedia } from '../../src/components/blocks/shared'
import type { Media, Page } from '../../src/payload-types'
import { aboutLayout } from '../../src/seed/about'
import { homeLayoutEN, homeLayoutNL } from '../../src/seed/home'

describe('Page Pattern contract', () => {
  it.each(Object.entries(pagePatterns))(
    'renders the registered %s fixture',
    async (slug, pattern) => {
      const render = pattern.render as (
        props: PagePatternRenderProps,
      ) => ReactNode | Promise<ReactNode>
      const output = await render({
        block: pattern.fixture.block,
        locale: 'nl',
      })
      const html = renderToStaticMarkup(output)

      expect(pattern.schema.slug).toBe(slug)
      expect(html).toContain(pattern.fixture.expectedText)
    },
  )

  it('renders the IFES basis as one linked semantic list', async () => {
    const block = aboutLayout('nl').find(
      (item) => item.blockType === 'content' && item.appearance?.anchor === 'geloofsbasis',
    )
    if (block?.blockType !== 'content') throw new Error('Missing basis-of-faith content block')

    const output = await pagePatterns.content.render({
      block,
      locale: 'nl',
    })
    const html = renderToStaticMarkup(output)

    expect(html.match(/<li/g)).toHaveLength(11)
    expect(html).toContain('href="https://ifesworld.org/en/beliefs/"')
  })

  it('renders localized curated photography in the About hero', async () => {
    const nlBlock = aboutLayout('nl').find((item) => item.blockType === 'hero')
    const enBlock = aboutLayout('en').find((item) => item.blockType === 'hero')
    if (nlBlock?.blockType !== 'hero') throw new Error('Missing Dutch About hero')
    if (enBlock?.blockType !== 'hero') throw new Error('Missing English About hero')

    const nlOutput = await pagePatterns.hero.render({
      block: nlBlock,
      locale: 'nl',
    })
    const enOutput = await pagePatterns.hero.render({
      block: enBlock,
      locale: 'en',
    })
    const nlHTML = renderToStaticMarkup(nlOutput)
    const enHTML = renderToStaticMarkup(enOutput)

    expect(nlHTML.match(/<img/g)).toHaveLength(1)
    expect(nlHTML).toContain('Vier studenten praten samen rond een tafel vol eten.')
    expect(enHTML).toContain('Four students talk together around a table full of food.')
  })

  it('renders the compact home showroom with one accessible description per photo', async () => {
    const nlBlock = homeLayoutNL.find((item) => item.blockType === 'photoStory')
    const enBlock = homeLayoutEN.find((item) => item.blockType === 'photoStory')
    if (nlBlock?.blockType !== 'photoStory') throw new Error('Missing Dutch home photo')
    if (enBlock?.blockType !== 'photoStory') throw new Error('Missing English home photo')

    const nlOutput = await pagePatterns.photoStory.render({
      block: nlBlock,
      locale: 'nl',
    })
    const enOutput = await pagePatterns.photoStory.render({
      block: enBlock,
      locale: 'en',
    })
    const nlHTML = renderToStaticMarkup(nlOutput)
    const enHTML = renderToStaticMarkup(enOutput)

    expect(nlHTML.match(/<img/g)).toHaveLength(6)
    expect(nlHTML.match(/alt=""/g)).toHaveLength(6)
    expect(nlHTML.match(/<figcaption/g)).toHaveLength(6)
    expect(nlHTML).toContain('photo-story--showroom')
    expect(nlHTML).toContain('aria-label="Fotogalerij. Scroll horizontaal voor meer foto’s."')
    // A <section> carrying an accessible name is a region landmark, so the
    // explicit role attribute is no longer rendered.
    expect(nlHTML).toContain('<section')
    expect(nlHTML).toContain('tabindex="0"')
    expect(nlHTML).toContain('aria-label="Automatisch afspelen pauzeren"')
    expect(nlHTML).not.toContain('aria-label="Vorige foto"')
    expect(nlHTML).not.toContain('aria-label="Volgende foto"')
    expect(nlHTML).not.toContain('Foto 1 van 6')
    expect(nlHTML).toContain('photo-showroom__pointer')
    expect(nlHTML).toContain('Studenten zitten in groepjes samen in een Leuvens park.')
    expect(nlHTML).toContain('Studenten praten samen rond een tafel vol eten.')
    expect(nlHTML).toContain('Studenten staan samen in een kring en bidden.')
    expect(enHTML).toContain('Students sit together in small groups in a park in Leuven.')
    expect(enHTML).toContain('Students talk together around a table full of food.')
    expect(enHTML).toContain('Students stand together in a circle and pray.')
    expect(enHTML).not.toContain('Photo 1 of 6')
    expect(nlHTML.match(/loading="lazy"/g)).toHaveLength(6)
    // Slides letterbox with object-fit: contain, so sizes scale with each
    // photo's orientation: landscape nearly fills the box, portrait does not.
    expect(nlHTML).toContain(
      'sizes="(max-width: 680px) calc(100vw - 28px), (max-width: 1048px) calc((100vw - 48px) * 0.84), 840px"',
    )
    expect(nlHTML).toContain(
      'sizes="(max-width: 680px) calc((100vw - 28px) * 0.44), (max-width: 1048px) calc((100vw - 48px) * 0.38), 380px"',
    )
    // The explicit ratio keeps the letterboxed slides from shifting layout.
    expect(nlHTML.match(/aspect-ratio:/g)).toHaveLength(6)
  })

  it('links the home statement to the about page in both locales', async () => {
    const nlBlock = homeLayoutNL.find((item) => item.blockType === 'statement')
    const enBlock = homeLayoutEN.find((item) => item.blockType === 'statement')
    if (nlBlock?.blockType !== 'statement') throw new Error('Missing Dutch home statement')
    if (enBlock?.blockType !== 'statement') throw new Error('Missing English home statement')

    const nlHTML = renderToStaticMarkup(
      await pagePatterns.statement.render({ block: nlBlock, locale: 'nl' }),
    )
    const enHTML = renderToStaticMarkup(
      await pagePatterns.statement.render({ block: enBlock, locale: 'en' }),
    )

    expect(nlHTML).toContain('href="/nl/over-ons"')
    expect(nlHTML).toContain('Lees meer over ons')
    expect(enHTML).toContain('href="/en/about-us"')
    expect(enHTML).toContain('More about us')
    // The statement sits on a dark accent surface, so the link uses the inverse button.
    expect(nlHTML).toContain('button--inverse')
  })

  it('keeps the page H1 independent from Hero order and prioritizes only a leading Hero image', () => {
    const hero = aboutLayout('en').find((item) => item.blockType === 'hero')
    if (hero?.blockType !== 'hero') throw new Error('Missing English About hero')
    const values = pagePatterns.values.fixture.block
    const trailingHero = renderToStaticMarkup(
      createElement(BlockRenderer, {
        blocks: [values, hero] as Page['layout'],
        locale: 'en',
        pageTitle: 'About',
      }),
    )
    const leadingHero = renderToStaticMarkup(
      createElement(BlockRenderer, {
        blocks: [hero, values] as Page['layout'],
        locale: 'en',
        pageTitle: 'About',
      }),
    )

    expect(trailingHero.match(/<h1/g)).toHaveLength(1)
    expect(trailingHero).toContain('<h1 class="sr-only">About</h1>')
    // The accented phrase splits the heading into spans, so compare its text.
    expect(trailingHero.match(/<h2>(.*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '')).toBe(
      'About Ichtus Leuven.',
    )
    // Next 16 marks priority images with a hoisted preload link.
    expect(trailingHero).not.toContain('rel="preload"')
    expect(trailingHero).toContain('loading="lazy"')
    expect(leadingHero.match(/<h1/g)).toHaveLength(1)
    expect(leadingHero).toContain('<link rel="preload" as="image"')
    // The LCP image must be requested at high priority (Lighthouse
    // lcp-discovery: "fetchpriority=high should be applied").
    expect(leadingHero).toMatch(/fetchpriority="high"/i)
    expect(leadingHero).not.toContain('loading="lazy"')
  })

  it('renders focal position and refuses an unlabelled meaningful media item', () => {
    const media = {
      alt: 'Students talking together',
      createdAt: new Date(0).toISOString(),
      focalPosition: { x: 25, y: 70 },
      height: 800,
      id: 1,
      isDecorative: false,
      updatedAt: new Date(0).toISOString(),
      url: '/api/media/file/community.webp',
      width: 1200,
    } as Media
    const html = renderToStaticMarkup(createElement(ResponsiveMedia, { media }))
    const missingAlt = renderToStaticMarkup(
      createElement(ResponsiveMedia, { media: { ...media, alt: '' } }),
    )

    expect(html).toContain('loading="lazy"')
    expect(html).toContain('object-position:25% 70%')
    expect(html).toContain('src="/api/media/file/community.webp"')
    expect(html).not.toContain('/_next/image')
    expect(missingAlt).toBe('')
  })

  it('links calendar entries that have a destination and leaves the others plain', () => {
    const html = renderToStaticMarkup(
      createElement(EventCalendar, {
        entries: [
          {
            allDay: false,
            color: 'var(--pink)',
            contrastColor: 'var(--blue)',
            id: '1',
            start: '2026-09-15T19:00:00.000Z',
            title: 'Kringavond',
            url: '/nl/activities/kringavond',
          },
          {
            allDay: false,
            color: 'var(--yellow)',
            contrastColor: 'var(--blue)',
            id: '2',
            start: '2026-09-16T19:00:00.000Z',
            title: 'Zonder pagina',
          },
        ],
        locale: 'nl',
      }),
    )

    expect(html).toContain('href="/nl/activities/kringavond"')
    expect(html).toContain('Zonder pagina')
    expect(html).not.toContain('href="/nl/activities/zonder-pagina"')
    // The Dutch locale file drives the toolbar, so the widget speaks the
    // page's language without a translation layer of our own.
    expect(html).toContain('aria-label="Vandaag"')
  })

  it('does not expose unlabelled section landmarks for headingless patterns', async () => {
    const values = await pagePatterns.values.render({
      block: pagePatterns.values.fixture.block,
      locale: 'nl',
    })
    const quote = await pagePatterns.quote.render({
      block: pagePatterns.quote.fixture.block,
      locale: 'nl',
    })

    expect(renderToStaticMarkup(values)).not.toContain('<section')
    expect(renderToStaticMarkup(quote)).not.toContain('<section')
  })
})
