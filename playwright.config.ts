import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command:
            'NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://127.0.0.1:3100/callback WORKOS_CLIENT_ID=client_playwright_guild WORKOS_COOKIE_PASSWORD=guild-playwright-only-cookie-password bun run dev -- -p 3100',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
