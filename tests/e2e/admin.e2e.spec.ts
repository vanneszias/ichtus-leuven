import { expect, type Page, test } from '@playwright/test'
import { login } from '../helpers/login'
import { testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page
  let userID: number

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
    const response = await page.request.get('http://localhost:3000/api/users/me')
    const body = (await response.json()) as { user: { id: number } }
    userID = body.user.id
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(?:\?.*)?$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can trigger a calendar synchronization from the activity list', async () => {
    await page.goto('http://localhost:3000/admin/collections/events')
    const button = page.getByRole('button', { name: 'Synchroniseer nu' })
    await expect(button).toBeVisible()

    // No Google credentials are configured for e2e, so the run is expected to
    // fail. Reaching that failure still proves the button reached the endpoint
    // on the admin session alone, rather than being rejected as unauthorized.
    const [response] = await Promise.all([
      page.waitForResponse((candidate) => candidate.url().includes('/api/calendar/sync')),
      button.click(),
    ])
    expect(response.status()).not.toBe(401)
    await expect(
      page.getByText(/Google Calendar request failed|Synchronisatie mislukt\./),
    ).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto(`http://localhost:3000/admin/collections/users/${userID}`)
    await expect(page).toHaveURL(new RegExp(`/admin/collections/users/${userID}(?:\\?.*)?$`))
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
