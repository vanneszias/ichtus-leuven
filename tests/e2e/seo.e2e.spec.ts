import { expect, test } from '@playwright/test'

let eventID: number
let eventSlugEN: string
let eventSlugNL: string
const siteURL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

function metadataTag(
  html: string,
  attribute: 'hreflang' | 'name' | 'property' | 'rel',
  value: string,
) {
  const tag = html
    .match(/<(?:link|meta)\b[^>]*>/g)
    ?.find((candidate) =>
      candidate.toLowerCase().includes(`${attribute.toLowerCase()}="${value.toLowerCase()}"`),
    )
  expect(tag, `${attribute}=${value}`).toBeTruthy()
  return tag
}

function tagAttribute(tag: string, attribute: string) {
  return tag.match(new RegExp(`${attribute}="([^"]*)"`, 'i'))?.[1]
}

function structuredData(html: string, id: string) {
  const contents = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>(.*?)</script>`, 's'))?.[1]
  expect(contents, id).toBeTruthy()
  return JSON.parse(contents)
}

test.describe('Technical SEO', () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/events?limit=100&locale=nl')
    const body = (await response.json()) as {
      docs: Array<{ id: number; slug: string; title: string }>
    }
    const event = body.docs.find(({ title }) => title === 'SEO metadata test')
    if (!event) throw new Error('SEO metadata test fixture is missing')
    eventID = event.id
    eventSlugNL = event.slug
    const english = await request.get(`http://localhost:3000/api/events/${eventID}?locale=en`)
    eventSlugEN = ((await english.json()) as { slug: string }).slug
  })

  test('serves root indexing and application metadata routes', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(robots.headers()['content-type']).toContain('text/plain')
    expect(await robots.text()).toContain('Disallow: /')

    const manifest = await request.get('/manifest.webmanifest')
    expect(manifest.status()).toBe(200)
    expect(manifest.headers()['content-type']).toContain('application/manifest+json')
    await expect(manifest.json()).resolves.toMatchObject({
      name: 'Ichtus Leuven',
      start_url: '/nl',
    })

    for (const path of ['/favicon.ico', '/icon.png', '/apple-icon.png']) {
      const icon = await request.get(path)
      expect(icon.status(), path).toBe(200)
      expect(icon.headers()['content-type'], path).toMatch(/^image\//)
    }

    for (const path of ['/nl', '/api/health']) {
      const response = await request.get(path)
      expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow, noarchive')
    }
  })

  test('renders localized canonical, social, robots and WebSite metadata', async ({ request }) => {
    const html = await (await request.get('/nl')).text()

    expect(tagAttribute(metadataTag(html, 'rel', 'canonical'), 'href')).toBe(`${siteURL}/nl`)
    expect(tagAttribute(metadataTag(html, 'hreflang', 'nl'), 'href')).toBe(`${siteURL}/nl`)
    expect(tagAttribute(metadataTag(html, 'hreflang', 'en'), 'href')).toBe(`${siteURL}/en`)
    expect(tagAttribute(metadataTag(html, 'name', 'robots'), 'content')).toMatch(
      /noindex.*nofollow.*noarchive/,
    )
    expect(tagAttribute(metadataTag(html, 'property', 'og:site_name'), 'content')).toBe(
      'Ichtus Leuven',
    )
    expect(tagAttribute(metadataTag(html, 'property', 'og:locale'), 'content')).toBe('nl_BE')
    expect(tagAttribute(metadataTag(html, 'property', 'og:url'), 'content')).toBe(`${siteURL}/nl`)
    expect(tagAttribute(metadataTag(html, 'property', 'og:image:alt'), 'content')).toContain(
      'Ichtus Leuven',
    )
    expect(tagAttribute(metadataTag(html, 'property', 'og:image:width'), 'content')).toMatch(/\d+/)
    expect(tagAttribute(metadataTag(html, 'name', 'twitter:card'), 'content')).toBe(
      'summary_large_image',
    )

    const data = structuredData(html, 'website-structured-data')
    expect(data['@graph'].map((node: { '@type': string }) => node['@type'])).toEqual([
      'Organization',
      'WebSite',
    ])
  })

  test('renders event metadata, Event JSON-LD and sitemap entries', async ({ request }) => {
    const html = await (await request.get(`/nl/activities/${eventSlugNL}`)).text()

    expect(tagAttribute(metadataTag(html, 'rel', 'canonical'), 'href')).toBe(
      `${siteURL}/nl/activities/${eventSlugNL}`,
    )
    expect(tagAttribute(metadataTag(html, 'hreflang', 'en'), 'href')).toBe(
      `${siteURL}/en/activities/${eventSlugEN}`,
    )
    expect(tagAttribute(metadataTag(html, 'property', 'og:url'), 'content')).toBe(
      `${siteURL}/nl/activities/${eventSlugNL}`,
    )
    expect(tagAttribute(metadataTag(html, 'name', 'twitter:card'), 'content')).toBe(
      'summary_large_image',
    )

    const event = structuredData(html, 'event-structured-data')
    expect(event).toMatchObject({
      '@type': 'Event',
      location: { '@type': 'Place', name: 'SEO Testzaal Leuven' },
      name: 'SEO metadata test',
      offers: { availability: 'https://schema.org/InStock' },
      url: `${siteURL}/nl/activities/${eventSlugNL}`,
    })
    expect(event.startDate).toBeTruthy()
    expect(event.endDate).toBeTruthy()
    expect(event.image).toHaveLength(1)

    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`/nl/activities/${eventSlugNL}`)
    expect(sitemap).toContain(`/en/activities/${eventSlugEN}`)
  })
})
