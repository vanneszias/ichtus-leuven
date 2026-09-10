import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveURL('http://localhost:3000/nl')
    await expect(page).toHaveTitle(/Ichtus Leuven/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ichtus Leuven')
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(
      'Door en voor studenten.',
    )
    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View in English' })).toHaveAttribute('href', '/en')
  })

  test('serves the English homepage', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ichtus Leuven')
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(
      'By students, for students.',
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('reveals the current logo behind the crest', async ({ page }) => {
    await page.goto('http://localhost:3000/nl')

    const headerLogo = page.locator('.site-header .logo')
    await expect(headerLogo.locator('.logo__crest')).toHaveCSS('opacity', '1')
    await expect(headerLogo.locator('.logo__current')).toHaveCSS('opacity', '0')

    await headerLogo.hover()
    await expect(headerLogo.locator('.logo__crest')).toHaveCSS('opacity', '0')
    await expect(headerLogo.locator('.logo__current')).toHaveCSS('opacity', '1')

    const footerLogo = page.locator('.site-footer .logo')
    await footerLogo.scrollIntoViewIfNeeded()
    await expect(footerLogo.locator('.logo__crest')).toHaveCSS('opacity', '1')
    await footerLogo.hover()
    await expect(footerLogo.locator('.logo__current')).toHaveCSS('opacity', '1')
  })

  test('uses a white canvas and valid localized navigation targets', async ({ page }) => {
    for (const locale of ['nl', 'en']) {
      await page.goto(`http://localhost:3000/${locale}`)
      await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)')

      const fragmentLinks = page.locator(`a[href^="/${locale}/#"]`)
      for (let index = 0; index < (await fragmentLinks.count()); index += 1) {
        const href = await fragmentLinks.nth(index).getAttribute('href')
        await expect(
          page.locator(`#${href?.split('#')[1]}`),
          `Missing target for ${href}`,
        ).toHaveCount(1)
      }
    }
  })

  test('serves localized privacy information from the footer', async ({ page }) => {
    await page.goto('http://localhost:3000/nl')
    await page
      .getByRole('navigation', { name: 'Voettekst' })
      .getByRole('link', { name: 'Privacy & cookies' })
      .click()
    await expect(page).toHaveURL('http://localhost:3000/nl/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy & cookies')
    await expect(page.getByRole('link', { name: 'View in English' })).toHaveAttribute(
      'href',
      '/en/privacy',
    )
  })

  test('offers keyboard skip navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/nl')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Naar de inhoud' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('keeps the mobile navigation keyboard-operable in a short viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 320 })
    await page.goto('http://localhost:3000/nl')

    const menu = page.locator('button[aria-controls="site-navigation"]')
    const navigation = page.getByRole('navigation', { name: 'Hoofdnavigatie' })
    const firstLink = navigation.getByRole('link', { name: 'over ons' })
    const language = page.getByRole('link', { name: 'View in English' })
    const logo = page.locator('.site-header .logo')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await expect(navigation).toBeVisible()
    await expect(firstLink).toBeFocused()
    await expect(page.locator('.menu-scrim')).toHaveAttribute('tabindex', '-1')

    const navigationBounds = await navigation.boundingBox()
    if (!navigationBounds) throw new Error('Missing mobile navigation bounds')
    expect(navigationBounds.y + navigationBounds.height).toBeLessThanOrEqual(320)
    // How many links the panel holds is editorial, so assert the guarantee
    // instead: whatever it holds stays reachable by scrolling inside it.
    await expect(navigation).toHaveCSS('overflow-y', 'auto')

    await page.keyboard.press('Shift+Tab')
    await expect(menu).toBeFocused()
    await language.focus()
    await page.keyboard.press('Tab')
    await expect(logo).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeFocused()
  })

  test('reveals the auto-hidden header when keyboard focus returns to it', async ({ page }) => {
    await page.goto('http://localhost:3000/nl')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await expect(page.locator('.site-header')).toHaveClass(/site-header--hidden/)

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.locator('.site-header .logo')).toBeFocused()
    await expect(page.locator('.site-header')).not.toHaveClass(/site-header--hidden/)
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('navigation', { name: 'Hoofdnavigatie' }).getByRole('link').first(),
    ).toBeFocused()
  })

  test('serves baseline security headers', async ({ request }) => {
    const response = await request.get('/nl')
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    const cancellation = await request.get(`/nl/registration/cancel/${'a'.repeat(64)}`)
    expect(cancellation.headers()['cache-control']).toMatch(/no-store|no-cache/)
    expect(cancellation.headers()['referrer-policy']).toBe('no-referrer')
    expect(cancellation.headers()['x-robots-tag']).toBe('noindex, nofollow, noarchive')
    const health = await request.get('/api/health')
    expect(health.ok()).toBe(true)
    await expect(health.json()).resolves.toEqual({ status: 'ok' })
  })

  test('serves the bilingual About section with localized paths', async ({ page }) => {
    await page.goto('http://localhost:3000/nl/over-ons')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Over ons')
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(
      'Over Ichtus Leuven',
    )
    await expect(page.locator('#wat-we-doen')).toHaveCount(1)
    await expect(page.locator('.hero__media img')).toHaveAttribute(
      'alt',
      'Vier studenten praten samen rond een tafel vol eten.',
    )
    await expect(page.locator('.photo-story')).toHaveCount(0)
    await expect(page.locator('#geloofsbasis li')).toHaveCount(11)
    await expect(page.locator('#netwerk')).not.toContainText('2007')
    await expect(page.locator('#netwerk .network-grid a')).toHaveCount(6)
    await expect(page.locator('#netwerk img')).toHaveCount(6)
    await expect(page.getByRole('link', { name: /Ichtus Vlaanderen/ })).toHaveAttribute(
      'href',
      'https://ichtus.be/',
    )
    const ifes = page.getByRole('link', {
      name: /^International Fellowship of Evangelical Students \(IFES\) \(opent in een nieuw venster\)$/,
    })
    await expect(ifes).toHaveAttribute('href', 'https://ifesworld.org/en/')
    await expect(page.locator('#netwerk .network-grid img').first()).toHaveAttribute('alt', '')
    await expect(
      page
        .getByRole('navigation', { name: 'Hoofdnavigatie' })
        .getByRole('link', { name: 'over ons' }),
    ).toHaveAttribute('aria-current', 'page')
    await expect(ifes).toHaveAttribute('target', '_blank')
    await expect(page.getByRole('link', { name: 'View in English' })).toHaveAttribute(
      'href',
      '/en/about-us',
    )

    await page.getByRole('link', { name: 'View in English' }).click()
    await expect(page).toHaveURL('http://localhost:3000/en/about-us')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About us')
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(
      'About Ichtus Leuven',
    )
  })

  test('shows the localized community showroom with pointer navigation and captions', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/nl')
    const showroom = page.locator('#over-ons.photo-story--showroom')
    await expect(showroom.locator('img')).toHaveCount(6)
    await expect(showroom.locator('figcaption')).toHaveText([
      'Samen eten aan één lange tafel in de tuin.',
      'Een moment van gebed samen.',
      'Bijpraten in de keuken.',
      'Een zonnige namiddag in het park.',
      'Samen zingen tijdens een gezamenlijke avond.',
      'Napraten in de tuin.',
    ])
    await expect(showroom.locator('figcaption').first()).toHaveCSS('font-size', '13px')
    await expect(showroom.locator('img').first()).toHaveCSS('object-fit', 'contain')
    await expect(showroom.locator('img').first()).toHaveCSS('border-radius', '12px')
    await expect(showroom.locator('img').first()).toHaveAttribute(
      'src',
      '/api/media/file/Ichtus-91.jpg',
    )
    await expect(showroom.locator('img').first()).toHaveAttribute('alt', '')

    const [viewportWidth, firstImageWidth] = await Promise.all([
      showroom.locator('.photo-story__grid').evaluate((element) => element.clientWidth),
      showroom
        .locator('figure')
        .first()
        .evaluate((element) => element.clientWidth),
    ])
    expect(firstImageWidth).toBe(viewportWidth)
    expect(viewportWidth).toBeLessThanOrEqual(1000)
    const [slideLeft, imageLeft] = await Promise.all([
      showroom
        .locator('figure')
        .first()
        .evaluate((element) => element.getBoundingClientRect().left),
      showroom
        .locator('img')
        .first()
        .evaluate((element) => element.getBoundingClientRect().left),
    ])
    expect(imageLeft).toBe(slideLeft)
    await expect(showroom).toHaveCSS('padding-bottom', '0px')
    await expect(showroom.getByRole('button')).toHaveCount(1)
    await expect(
      showroom.getByRole('button', { name: 'Automatisch afspelen pauzeren' }),
    ).toHaveCount(1)
    await expect(showroom.getByRole('status')).toHaveText('')

    await showroom.scrollIntoViewIfNeeded()
    const mediaBounds = await showroom.locator('.photo-story__media').first().boundingBox()
    if (!mediaBounds) throw new Error('Missing showroom media bounds')
    await page.mouse.move(
      mediaBounds.x + mediaBounds.width * 0.9,
      mediaBounds.y + mediaBounds.height / 2,
    )
    await expect(showroom.locator('.photo-showroom__pointer')).toHaveAttribute(
      'data-direction',
      'next',
    )
    await page.mouse.down()
    await page.mouse.up()
    await expect
      .poll(() => showroom.locator('.photo-story__grid').evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(viewportWidth / 2)

    const portraitMedia = await showroom.locator('.photo-story__media').nth(1).boundingBox()
    const portraitImage = await showroom.locator('img').nth(1).boundingBox()
    if (!portraitMedia || !portraitImage) throw new Error('Missing portrait image bounds')
    expect(portraitImage.width).toBeLessThan(portraitMedia.width)
    await page.mouse.move(
      portraitImage.x + portraitImage.width + 40,
      portraitImage.y + portraitImage.height / 2,
    )
    await expect(showroom.locator('.photo-showroom__pointer')).toHaveAttribute(
      'data-direction',
      'next',
    )
    await page.mouse.move(
      portraitImage.x + portraitImage.width * 0.25,
      portraitImage.y + portraitImage.height / 2,
    )
    await expect(showroom.locator('.photo-showroom__pointer')).toHaveAttribute(
      'data-direction',
      'previous',
    )
    await expect(
      page.getByRole('heading', { name: 'God, elkaar en de wereld om ons heen.' }),
    ).toHaveCount(0)
  })

  test('stops showroom autoplay when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('http://localhost:3000/nl')

    const showroom = page.locator('#over-ons.photo-story--showroom')
    const grid = showroom.locator('.photo-story__grid')
    await expect(
      showroom.getByRole('button', { name: 'Automatisch afspelen pauzeren' }),
    ).toBeHidden()
    await page.waitForTimeout(6200)
    expect(await grid.evaluate((element) => element.scrollLeft)).toBe(0)
  })

  test('uses contrast-safe heading accents and focus indicators', async ({ page }) => {
    await page.goto('http://localhost:3000/nl')

    const heroAccent = page.locator('.hero .highlight')
    await expect(heroAccent).toHaveText('studenten')
    await expect(heroAccent).toHaveCSS('color', 'rgb(41, 54, 103)')
    const heroAction = page.getByRole('link', { name: 'Bekijk de agenda' }).first()
    await heroAction.focus()
    await expect(heroAction).toHaveCSS('outline-color', 'rgb(41, 54, 103)')

    const emailAction = page.getByRole('link', { name: 'Stuur een e-mail' }).last()
    await emailAction.scrollIntoViewIfNeeded()
    await emailAction.focus()
    await expect(emailAction).toHaveCSS('outline-color', 'rgb(255, 255, 255)')
    await expect(
      page.getByRole('link', {
        name: /^Bekijk Instagram \(opent in een nieuw venster\)$/,
      }),
    ).toHaveAttribute('target', '_blank')
  })

  test('keeps practical mobile controls at least 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('http://localhost:3000/nl')

    const undersized = await page
      .locator('.menu-button, .button, .photo-showroom__autoplay')
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const style = getComputedStyle(element)
            return style.display !== 'none' && style.visibility !== 'hidden'
          })
          .filter((element) => element.getBoundingClientRect().height < 44)
          .map((element) => ({
            className: element.className,
            height: element.getBoundingClientRect().height,
          })),
      )
    expect(undersized).toEqual([])
  })

  test('serves localized not-found recovery pages', async ({ page }) => {
    for (const [locale, heading, action] of [
      ['nl', 'Deze pagina konden we niet vinden.', 'Terug naar de homepagina'],
      ['en', 'This page could not be found.', 'Back to the homepage'],
    ] as const) {
      const response = await page.goto(`http://localhost:3000/${locale}/bestaat-niet`)
      expect(response?.status()).toBe(404)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(page.getByRole('link', { name: action })).toHaveAttribute('href', `/${locale}`)
    }
  })

  test('keeps marketing headings and indexes free of generic AI patterns', async ({ page }) => {
    await page.goto('http://localhost:3000/nl/over-ons')

    await expect(page.locator('.eyebrow')).toHaveCount(0)
    await expect(page.locator('.info-card')).toHaveCount(0)
    await expect(page.locator('.info-row')).toHaveCount(3)
    await expect(page.getByRole('navigation', { name: 'Over ons' })).toHaveCount(0)
  })

  test('redirects current and legacy About detail paths to the unified page', async ({ page }) => {
    const redirects = [
      ['/nl/wie-we-zijn', '/nl/over-ons#wie-we-zijn'],
      ['/nl/over-ons/wie-we-zijn', '/nl/over-ons#wie-we-zijn'],
      ['/nl/wat-we-doen', '/nl/over-ons#wat-we-doen'],
      ['/nl/over-ons/wat-we-doen', '/nl/over-ons#wat-we-doen'],
      ['/nl/geschiedenis', '/nl/over-ons#netwerk'],
      ['/nl/over-ons/geschiedenis', '/nl/over-ons#netwerk'],
      ['/en/who-we-are', '/en/about-us#who-we-are'],
      ['/en/about-us/who-we-are', '/en/about-us#who-we-are'],
      ['/en/what-we-do', '/en/about-us#what-we-do'],
      ['/en/about-us/what-we-do', '/en/about-us#what-we-do'],
      ['/en/history', '/en/about-us#network'],
      ['/en/about-us/history', '/en/about-us#network'],
    ]
    for (const [source, destination] of redirects) {
      await page.goto(`http://localhost:3000${source}`)
      await expect(page).toHaveURL(`http://localhost:3000${destination}`)
    }
  })

  test('keeps retired About detail pages out of the sitemap', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    const body = await sitemap.text()
    expect(body).toContain('/nl/over-ons')
    expect(body).toContain('/en/about-us')
    expect(body).not.toContain('/over-ons/wie-we-zijn')
    expect(body).not.toContain('/about-us/who-we-are')
  })
})
