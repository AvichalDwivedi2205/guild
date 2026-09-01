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
  await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  await expect(page.getByRole('link', { name: /Start building/ })).toHaveAttribute(
    'href',
    '/sign-up',
  );
  await expect(page.getByRole('link', { name: /demo/i })).toHaveCount(0);
});
