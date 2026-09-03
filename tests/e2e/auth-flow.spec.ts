import { expect, test } from '@playwright/test';

test('signs in through AuthKit authorization, callback, and sealed session', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4100\/user_management\/authorize/);

  await page.getByText('Pick an account (1)', { exact: true }).click();
  const callbackResponse = page.waitForResponse((response) =>
    response.url().startsWith('http://localhost:3200/callback'),
  );
  await page.getByRole('button', { name: /guild-e2e@example\.com/i }).click();
  const callback = await callbackResponse;
  expect(callback.status()).toBe(307);
  expect(callback.headers().location).toBe('http://localhost:3200/workspaces');

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === 'wos-session')).toMatchObject({
    httpOnly: true,
    sameSite: 'Lax',
  });
  await expect(page).toHaveURL('http://localhost:3200/workspaces');
  await page.goto('/runner/pair');
  await expect(page.getByRole('heading', { name: 'Pair Guild Runner' })).toBeVisible();
});
