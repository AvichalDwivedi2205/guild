import { existsSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const storageState = process.env.GUILD_E2E_STORAGE_STATE;
const workspacePath = process.env.GUILD_E2E_WORKSPACE_PATH;
const authenticated = Boolean(
  storageState && existsSync(storageState) && workspacePath?.startsWith('/workspaces/'),
);

test.describe('Guild accessibility and resilience', () => {
  test('landing has no automatically detectable WCAG A/AA violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('landing primary navigation is keyboard reachable', async ({ page }) => {
    await page.goto('/');
    const home = page.getByRole('link', { name: 'Guild home' });
    await expect(home).toHaveJSProperty('tabIndex', 0);
    await home.focus();
    await expect(home).toBeFocused();
    await page.keyboard.press('Tab');
    const nextControl =
      (page.viewportSize()?.width ?? 1_000) <= 820
        ? page.getByRole('link', { name: /Start building/ })
        : page.getByRole('link', { name: 'Canvas', exact: true });
    await expect(nextControl).toBeFocused();
  });

  test.describe('authenticated workspace', () => {
    test.skip(
      !authenticated,
      'Requires untracked GUILD_E2E_STORAGE_STATE plus GUILD_E2E_WORKSPACE_PATH.',
    );
    test.use({ storageState: storageState ?? undefined });

    test('workspace has no automatically detectable WCAG A/AA violations', async ({ page }) => {
      await page.goto(workspacePath!);
      await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
    });

    test('panel focus and Escape return to the canvas without trapping focus', async ({ page }) => {
      await page.goto(workspacePath!);
      await page.getByRole('button', { name: 'Overview' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('complementary', { name: 'Overview' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('complementary', { name: 'Overview' })).toHaveCount(0);
      await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    });

    test('reduced-motion preference keeps core controls operable', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(workspacePath!);
      await page.getByRole('button', { name: 'Present', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Exit presentation' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
    });
  });
});
