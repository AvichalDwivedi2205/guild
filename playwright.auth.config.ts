import { defineConfig, devices } from '@playwright/test';

const appUrl = 'http://localhost:3200';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'auth-flow.spec.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'html',
  use: {
    baseURL: appUrl,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command:
        'WORKOS_EMULATE_DISABLE_UPDATE_CHECK=1 bunx workos-emulate --port 4100 --interactive --seed tests/fixtures/workos-emulate.config.yaml',
      url: 'http://127.0.0.1:4100/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'WORKOS_API_KEY=sk_test_default WORKOS_API_HOSTNAME=127.0.0.1 WORKOS_API_HTTPS=false WORKOS_API_PORT=4100 WORKOS_CLIENT_ID=client_playwright_guild WORKOS_COOKIE_PASSWORD=guild-playwright-only-cookie-password NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3200/callback bun run dev -- -p 3200',
      url: appUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
