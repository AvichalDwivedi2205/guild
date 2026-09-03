import { existsSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { callWebMcp, installWebMcpHost, registeredWebMcpToolNames } from './helpers/webmcp';

const storageState = process.env.GUILD_E2E_STORAGE_STATE;
const workspacePath = process.env.GUILD_E2E_WORKSPACE_PATH;
const designSetKey = process.env.GUILD_E2E_DESIGN_SET_KEY;
const authenticated = Boolean(
  storageState && existsSync(storageState) && workspacePath?.startsWith('/workspaces/'),
);

const toolNames = [
  'list_workspaces',
  'get_workspace_context',
  'search_canvas',
  'apply_canvas_changes',
  'add_comment',
  'run_ai_team',
  'get_run_status',
  'get_runner_status',
  'stop_run',
  'retry_job',
  'undo_run',
  'list_implementation_tasks',
  'claim_task',
  'report_task_result',
  'publish_design_preview',
  'get_design_set',
  'get_design_revision_status',
  'register_workstream',
  'report_workstream_update',
  'complete_workstream',
  'get_workstream_feedback',
  'acknowledge_workstream_feedback',
  'report_implementation_evidence',
  'list_implementation_evidence',
] as const;

test.describe('Guild authenticated demo path', () => {
  test.skip(
    !authenticated,
    'Requires untracked GUILD_E2E_STORAGE_STATE plus GUILD_E2E_WORKSPACE_PATH.',
  );

  test.use({ storageState: storageState ?? undefined });

  test('loads real workspace, canvas controls, workstreams, and presentation mode', async ({
    page,
  }) => {
    await page.goto(workspacePath!);

    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    await expect(page.getByLabel('Canvas creation toolbar')).toBeVisible();
    await expect(page.getByLabel('Workspace panels')).toBeVisible();

    await page.getByLabel('Agent dock').click();
    await expect(page.getByLabel('Agent dock')).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: 'Present', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Exit presentation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
  });

  test('trackpad-style scrolling pans canvas without moving page', async ({ page }) => {
    await page.goto(workspacePath!);
    const viewport = page.locator('.react-flow__viewport');
    await expect(viewport).toBeVisible();
    const before = await viewport.getAttribute('style');

    const canvas = page.getByLabel(/infinite canvas/i);
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(180, 120);

    await expect.poll(() => viewport.getAttribute('style')).not.toBe(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('double-clicking whole text node opens inline editor', async ({ page }) => {
    await page.goto(workspacePath!);
    const textNode = page.locator('[data-node-type="text"]').first();
    test.skip((await textNode.count()) === 0, 'Workspace needs one text object.');

    await textNode.dblclick();
    await expect(textNode.getByRole('textbox', { name: /^Edit / })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(textNode.getByRole('textbox', { name: /^Edit / })).toHaveCount(0);
  });

  test('opens a complete task result from its canvas preview', async ({ page }) => {
    await page.goto(workspacePath!);
    const taskNode = page.locator('[data-node-type="task"]').first();
    test.skip((await taskNode.count()) === 0, 'Workspace needs one task object.');

    const title = await taskNode.getAttribute('aria-label');
    await taskNode.dblclick();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    if (title) await expect(dialog).toHaveAccessibleName(title.replace(/ canvas object$/, ''));
    await expect(dialog.getByRole('button', { name: 'Edit content' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('registers all WebMCP tools and executes authenticated read through page service', async ({
    page,
  }) => {
    await installWebMcpHost(page);
    await page.goto(workspacePath!);

    await expect.poll(() => registeredWebMcpToolNames(page)).toEqual(toolNames);

    const result = await callWebMcp<{ workspaces: Array<{ _id: string }> }>(
      page,
      'list_workspaces',
      {},
    );
    expect(
      result.workspaces.some((workspace) => workspace._id === workspacePath!.split('/').at(-1)),
    ).toBe(true);
  });

  test('opens exact design revision Focus and exits back to canvas', async ({ page }) => {
    test.skip(
      !designSetKey,
      'Requires GUILD_E2E_DESIGN_SET_KEY with at least one published revision.',
    );
    await page.goto(`${workspacePath}?focus=design&designSet=${encodeURIComponent(designSetKey!)}`);

    await expect(page.getByLabel('Design focus')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Interact' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comment' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Approve v\d+/ })).toBeVisible();
    await page.getByRole('button', { name: 'Exit Focus' }).click();
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });

  test('mobile canvas keeps primary controls reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(workspacePath!);

    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    await expect(page.getByLabel('Agent dock')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
  });
});
