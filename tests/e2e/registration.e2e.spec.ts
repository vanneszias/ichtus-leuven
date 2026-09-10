import { expect, test } from '@playwright/test'

let eventSlug: string
let eventEndsAt: string
let eventStartsAt: string
const cancellationToken = 'c'.repeat(64)
const siteURL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

test.describe('Activity registration', () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/events?limit=100&locale=nl')
    const body = (await response.json()) as {
      docs: Array<{ endsAt: string; slug: string; startsAt: string; title: string }>
    }
    const event = body.docs.find(({ title }) => title === 'Open registration test')
    if (!event) throw new Error('Open registration test fixture is missing')
    eventSlug = event.slug
    eventStartsAt = event.startsAt
    eventEndsAt = event.endsAt
  })

  test('confirms a place and then offers the waitlist', async ({ page }) => {
    await page.route('**/api/activity-signup', async (route) => {
      const response = await route.fetch({
        headers: { ...route.request().headers(), origin: siteURL },
      })
      await route.fulfill({ response })
    })
    await page.goto(`http://localhost:3000/nl/activities/${eventSlug}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Open registration test')
    const dateRange = new Intl.DateTimeFormat('nl-BE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Brussels',
    }).formatRange(new Date(eventStartsAt), new Date(eventEndsAt))
    await expect(page.locator('.activity-meta strong')).toContainText(dateRange)

    await page.getByLabel('Je naam').fill('Eerste Student')
    await page.getByLabel('E-mailadres').fill('first-browser@example.com')
    const firstResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/activity-signup'),
    )
    await page.getByRole('button', { name: 'Schrijf me in' }).click()
    const firstSignup = await firstResponse
    expect(await firstSignup.text()).toContain('confirmed')
    await expect(
      page.getByText('Je plaats is bevestigd. Bekijk je inbox voor de details.'),
    ).toBeVisible()

    await page.getByLabel('Je naam').fill('Tweede Student')
    await page.getByLabel('E-mailadres').fill('second-browser@example.com')
    const secondResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/activity-signup'),
    )
    await page.getByRole('button', { name: 'Schrijf me in' }).click()
    const secondSignup = await secondResponse
    expect(await secondSignup.text()).toContain('waitlisted')
    await expect(
      page.getByText('Je staat op de wachtlijst. We mailen je als er een plaats vrijkomt.'),
    ).toBeVisible()
  })

  test('associates invalid signup fields and focuses the first error', async ({ page }) => {
    await page.goto(`http://localhost:3000/nl/activities/${eventSlug}`)

    const name = page.getByLabel('Je naam')
    const email = page.getByLabel('E-mailadres')
    await page.getByRole('button', { name: 'Schrijf me in' }).click()

    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toHaveAttribute('aria-describedby', 'registration-name-error')
    await expect(page.locator('#registration-name-error')).toHaveText('Vul je naam in.')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#registration-email-error')).toHaveText('Vul je e-mailadres in.')

    await name.fill('Browser Student')
    await email.fill('ongeldig-adres')
    await page.getByRole('button', { name: 'Schrijf me in' }).click()
    await expect(email).toBeFocused()
    await expect(page.locator('#registration-email-error')).toHaveText(
      'Vul een geldig e-mailadres in.',
    )
  })

  test('announces and focuses a signup service error', async ({ page }) => {
    await page.route('**/api/activity-signup', (route) =>
      route.fulfill({
        body: JSON.stringify({ error: 'Unable to register' }),
        contentType: 'application/json',
        status: 500,
      }),
    )
    await page.goto(`http://localhost:3000/nl/activities/${eventSlug}`)
    await page.getByLabel('Je naam').fill('Browser Student')
    await page.getByLabel('E-mailadres').fill('service-error@example.com')
    await page.getByRole('button', { name: 'Schrijf me in' }).click()

    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'We konden je inschrijving niet bevestigen.' })
    await expect(alert).toContainText('We konden je inschrijving niet bevestigen.')
    await expect(alert).toBeFocused()
  })

  test('describes cancellation progress and exposes the busy state', async ({ page }) => {
    let markRequestStarted: () => void = () => undefined
    let releaseResponse: () => void = () => undefined
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve
    })
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    await page.route('**/api/activity-cancel', async (route) => {
      markRequestStarted()
      await responseGate
      await route.fulfill({ body: JSON.stringify({ ok: true }), contentType: 'application/json' })
    })
    await page.goto(`http://localhost:3000/nl/registration/cancel/${cancellationToken}`)

    await page.getByRole('button', { name: 'Annuleer mijn inschrijving' }).click()
    const cancellation = page.locator('.cancellation-form')
    await expect(cancellation).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('button', { name: 'Annulering verwerken…' })).toBeDisabled()

    await requestStarted
    releaseResponse()
    await expect(page.getByRole('status')).toHaveText('Je inschrijving is geannuleerd.')
  })
})
