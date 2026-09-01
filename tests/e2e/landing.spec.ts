import { expect, test } from '@playwright/test';

test('landing explains real local Worker architecture and exposes real auth entry points', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Build with an AI team, not an AI chat.' }),
  ).toBeVisible();
  await expect(
    page.getByText('No model API keys. Your local client logins stay local.'),
  ).toBeVisible();
  await expect(page.locator('nav[aria-label="Main navigation"] a[href="/sign-in"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Start building/ })).toHaveAttribute(
    'href',
    '/sign-up',
  );
  await expect(page.getByRole('heading', { name: 'Three ways to make things.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Give every Worker a clear job.' })).toBeVisible();
  await expect(page.getByText('Codex CLI', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Claude Code', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /demo/i })).toHaveCount(0);
  await expect(page.getByText(/GPT|Gemini|Bring your own agent/i)).toHaveCount(0);
});

test('landing theme control switches the visual system without a reload', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const toggle = page.getByRole('button', { name: 'Use light theme' });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Use dark theme' })).toBeVisible();
  }
});
