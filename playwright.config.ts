import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  timeout: 60_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: [
      'pnpm seed:local',
      'cross-env NODE_OPTIONS=--no-deprecation PAYLOAD_DB_PUSH=false tsx tests/helpers/seedE2EFixtures.ts',
      'cross-env NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build --webpack',
      'cross-env NODE_OPTIONS=--no-deprecation PAYLOAD_DB_PUSH=false next start',
    ].join(' && '),
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
    timeout: 180_000,
  },
})
