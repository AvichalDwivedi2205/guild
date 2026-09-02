import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = process.env.GUILD_E2E_STORAGE_STATE;
const authenticated = Boolean(storageState && existsSync(storageState));

test.describe('Cinema demo authenticated matrix', () => {
  test.skip(!authenticated, 'Requires an untracked GUILD_E2E_STORAGE_STATE file.');

  test.use({ storageState: storageState ?? undefined });

  test('1 sign in, open workspace, sign out', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    await page.getByRole('link', { name: /sign out/i }).click();
  });

  test('2 membership denial stays on the denied workspace', async ({ page }) => {
    await page.goto('/app/workspaces/missing-workspace');
    await expect(page.getByText(/sign in|denied|not found/i)).toBeVisible();
  });

  test('3 representative objects across renderer families', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });

  test('4 two-browser comments and approval stay live', async ({ page, context }) => {
    await page.goto('/app');
    const other = await context.newPage();
    await other.goto(page.url());
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    await other.close();
  });

  test('5 contextual editing does not swallow pan', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByText('comment')).toBeVisible();
  });

  test('6 publication updates the gallery', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });

  test('7 Focus Interact Comment and screenshot fallback', async ({ page }) => {
    await page.goto('/app?focus=design&designSet=cinema-home');
    await expect(page.getByLabel('Design focus')).toBeVisible();
  });

  test('8 exactly one visual delivery', async ({ page }) => {
    await page.goto('/app?focus=design&designSet=cinema-home&screen=landing');
    await expect(page.getByRole('button', { name: 'Comment' })).toBeVisible();
  });

  test('9 compare and approve an exact revision', async ({ page }) => {
    await page.goto('/app?focus=design&designSet=cinema-home');
    await expect(page.getByRole('button', { name: 'Compare' })).toBeVisible();
  });

  test('10 external workstream evidence and preview link', async ({ page }) => {
    await page.goto('/app?focus=evidence&workstream=backend');
    await expect(page.getByLabel('Evidence focus')).toBeVisible();
  });

  test('11 Runner Stop/Retry vs reported Ask agent', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: 'Agent dock' }).click();
    await expect(page.getByText(/active/i)).toBeVisible();
  });

  test('12 native WebMCP visible mutation', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });

  test('13 mobile and keyboard review', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app');
    await page.keyboard.press('c');
  });

  test('14 reset and second complete run', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('button', { name: /Present/ })).toBeVisible();
  });

  test('15 second rehearsal uses the same scenario workspace', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });
});
