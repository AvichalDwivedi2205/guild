import { existsSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { rectanglesIntersect } from '@/domain/geometry';
import { acceptanceKey, callWebMcp, installWebMcpHost } from './helpers/webmcp';

const storageState = process.env.GUILD_E2E_STORAGE_STATE;
const workspacePath = process.env.GUILD_E2E_WORKSPACE_PATH;
const failedJobId = process.env.GUILD_E2E_FAILED_JOB_ID;
const undoRunId = process.env.GUILD_E2E_UNDO_RUN_ID;
const undoObjectId = process.env.GUILD_E2E_UNDO_OBJECT_ID;
const authenticated = Boolean(
  storageState && existsSync(storageState) && workspacePath?.startsWith('/workspaces/'),
);
const workspaceId = workspacePath?.split('/').at(-1) ?? '';

type ContextObject = {
  _id: string;
  type: string;
  title?: string;
  contentRevision: number;
  semanticsRevision: number;
  hierarchyRevision: number;
  geometryRevision: number;
};

type ContextRole = {
  _id: string;
  name: string;
  handle: string;
  engine: 'codex' | 'claude';
  ownedSectionId: string;
  staticDependencyRoleProfileIds: string[];
};
type ContextTeam = { _id: string; name: string; roleProfileIds: string[] };
type ContextRun = {
  run: { _id: string; state: string; createdAt: number };
  jobs: Array<{
    _id: string;
    state: string;
    engine: 'codex' | 'claude';
    reservation: {
      status: 'reserved' | 'completed' | 'released';
      bounds: { x: number; y: number; width: number; height: number };
    } | null;
  }>;
};
type WorkspaceContext = {
  objects: ContextObject[];
  edges: Array<{ _id: string; revision: number }>;
  roles: ContextRole[];
  teams: ContextTeam[];
  runs: ContextRun[];
};

type ProtocolAssignment = {
  jobId: string;
  runId: string;
  attempt: number;
  fencingToken: number;
  assignmentToken: string;
  mcpEndpoint: string;
  expectedArtifactTypes: string[];
};

const acceptanceTeamName = `Guild acceptance pair ${Date.now()}`;

async function workspaceContext(page: Page) {
  return callWebMcp<WorkspaceContext>(page, 'get_workspace_context', {
    workspaceId,
    objectLimit: 500,
  });
}

async function deleteObjects(page: Page, objects: ContextObject[]) {
  if (objects.length === 0) return;
  for (let offset = 0; offset < objects.length; offset += 25) {
    const batch = objects.slice(offset, offset + 25);
    await callWebMcp(page, 'apply_canvas_changes', {
      workspaceId,
      idempotencyKey: acceptanceKey('cleanup'),
      changes: batch.map((object) => ({
        command: 'delete_object',
        objectId: object._id,
        expectedRevision: object.hierarchyRevision,
      })),
    });
  }
}

function assignmentHeaders(assignment: ProtocolAssignment) {
  return {
    authorization: `Bearer ${assignment.assignmentToken}`,
    'x-guild-job-id': assignment.jobId,
    'x-guild-attempt': String(assignment.attempt),
    'x-guild-fencing-token': String(assignment.fencingToken),
  };
}

test('protected workspace sends a signed-out browser to WorkOS', async ({ browser }) => {
  test.skip(!workspacePath, 'Requires GUILD_E2E_WORKSPACE_PATH.');
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(workspacePath!);
    await expect(page.getByLabel(/infinite canvas/i)).toHaveCount(0);
    await expect.poll(() => page.url()).not.toContain(workspacePath!);
  } finally {
    await context.close();
  }
});

test.describe.serial('Guild connected acceptance matrix', () => {
  test.skip(
    !authenticated,
    'Requires untracked GUILD_E2E_STORAGE_STATE plus GUILD_E2E_WORKSPACE_PATH.',
  );
  test.use({ storageState: storageState ?? undefined });

  test.beforeEach(async ({ page }) => {
    await installWebMcpHost(page);
  });

  test('2 and 3: creates a real workspace and opens its canvas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Mutation flow runs once on desktop Chromium.');
    const title = 'Guild Browser Acceptance';
    await page.goto('/workspaces');
    const existing = page.getByRole('link', { name: new RegExp(title) });
    if ((await existing.count()) === 0) {
      await page.getByLabel('Workspace name').fill(title);
      await page.getByRole('button', { name: 'Create workspace' }).click();
      await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
    }
    await page.getByRole('link', { name: new RegExp(title) }).click();
    await expect(page).toHaveURL(/\/workspaces\/[a-z0-9]+/);
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
  });

  test('4 and 5: creates, renders, and edits every renderer family across all modes', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Mutation flow runs once on desktop Chromium.');
    await page.goto(workspacePath!);
    const before = await workspaceContext(page);
    const beforeIds = new Set(before.objects.map((object) => object._id));
    const cases = [
      ['Diagram', 'Shape'],
      ['Diagram', 'Table'],
      ['Diagram', 'Image'],
      ['Diagram', 'Section'],
      ['Diagram', 'Drawing'],
      ['Diagram', 'Text'],
      ['Task', 'Task'],
      ['Wireframe', 'Frame'],
    ] as const;
    let created: ContextObject[] = [];
    try {
      for (const [mode, label] of cases) {
        await page.getByRole('button', { name: mode, exact: true }).click();
        const create = page.getByRole('button', { name: `Create ${label}`, exact: true });
        await expect(create).toBeEnabled();
        await create.click();
        await expect(create).toBeEnabled();
      }
      await expect
        .poll(async () => (await workspaceContext(page)).objects.length)
        .toBeGreaterThan(before.objects.length + cases.length - 1);
      const after = await workspaceContext(page);
      created = after.objects.filter((object) => !beforeIds.has(object._id));
      expect(new Set(created.map((object) => object.type))).toEqual(
        new Set([
          'shape',
          'table',
          'image',
          'section',
          'drawing',
          'text',
          'task',
          'wireframeFrame',
        ]),
      );
      const text = created.find((object) => object.type === 'text')!;
      const textNode = page.locator(`.react-flow__node[data-id="${text._id}"]`);
      await textNode.dblclick();
      const editor = textNode.getByRole('textbox', { name: /^Edit / });
      await editor.fill('Browser-edited text');
      await editor.press('Enter');
      await expect(textNode).toContainText('Browser-edited text');
    } finally {
      const current = await workspaceContext(page);
      const currentCreated = current.objects.filter((object) => !beforeIds.has(object._id));
      await deleteObjects(page, currentCreated.length ? currentCreated : created);
    }
  });

  test('6: connects objects and assigns semantic meaning through WebMCP', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Mutation flow runs once on desktop Chromium.');
    await page.goto(workspacePath!);
    const created = await callWebMcp<{ changedIds: string[] }>(page, 'apply_canvas_changes', {
      workspaceId,
      idempotencyKey: acceptanceKey('semantic-nodes'),
      changes: [
        {
          command: 'create_object',
          logicalKey: acceptanceKey('requirement'),
          type: 'sticky',
          title: 'Acceptance requirement',
          positionHint: { x: 120, y: 120 },
          coordinateSpace: 'canvas',
          size: { width: 240, height: 160 },
          semantics: { semanticType: 'requirement', projectArea: 'product' },
        },
        {
          command: 'create_object',
          logicalKey: acceptanceKey('implementation'),
          type: 'task',
          title: 'Acceptance implementation',
          positionHint: { x: 520, y: 120 },
          coordinateSpace: 'canvas',
          size: { width: 300, height: 164 },
          semantics: { semanticType: 'implementation-task', projectArea: 'implementation' },
        },
      ],
    });
    try {
      const context = await workspaceContext(page);
      const objects = context.objects.filter((object) => created.changedIds.includes(object._id));
      expect(objects).toHaveLength(2);
      await callWebMcp(page, 'apply_canvas_changes', {
        workspaceId,
        idempotencyKey: acceptanceKey('semantic-edge'),
        changes: [
          {
            command: 'create_edge',
            sourceObjectId: objects[0]!._id,
            targetObjectId: objects[1]!._id,
            relationship: 'implements',
            label: 'implements',
          },
        ],
      });
      await expect(
        page.getByLabel(`Edge from ${objects[0]!._id} to ${objects[1]!._id}`),
      ).toBeVisible();
    } finally {
      const context = await workspaceContext(page);
      await deleteObjects(
        page,
        context.objects.filter((object) => created.changedIds.includes(object._id)),
      );
    }
  });

  test('7: a second browser context receives object edits in realtime', async ({
    browser,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Realtime flow runs once on desktop Chromium.');
    const secondContext = await browser.newContext({ storageState: storageState! });
    await installWebMcpHost(secondContext);
    const secondPage = await secondContext.newPage();
    await page.goto(workspacePath!);
    await secondPage.goto(workspacePath!);
    const title = `Realtime ${acceptanceKey('object')}`;
    const created = await callWebMcp<{ changedIds: string[] }>(page, 'apply_canvas_changes', {
      workspaceId,
      idempotencyKey: acceptanceKey('realtime-create'),
      changes: [
        {
          command: 'create_object',
          type: 'text',
          title,
          content: { text: title },
          positionHint: { x: 220, y: 220 },
          coordinateSpace: 'canvas',
          size: { width: 260, height: 72 },
        },
      ],
    });
    try {
      await expect(secondPage.getByText(title, { exact: true })).toBeVisible();
      await expect(secondPage.getByLabel(/1 collaborators/)).toBeVisible();
      const firstNode = page.locator(`.react-flow__node[data-id="${created.changedIds[0]}"]`);
      await firstNode.click();
      const canvas = page.getByLabel(/infinite canvas/i);
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      await page.mouse.move(canvasBox!.x + canvasBox!.width / 2, canvasBox!.y + 180);
      await expect
        .poll(() => secondPage.locator('[data-kind="human"]').count())
        .toBeGreaterThanOrEqual(2);
      const context = await workspaceContext(page);
      const object = context.objects.find((candidate) =>
        created.changedIds.includes(candidate._id),
      )!;
      await callWebMcp(page, 'apply_canvas_changes', {
        workspaceId,
        idempotencyKey: acceptanceKey('realtime-edit'),
        changes: [
          {
            command: 'update_object',
            objectId: object._id,
            segment: 'content',
            expectedRevision: object.contentRevision,
            patch: { text: `${title} updated` },
          },
        ],
      });
      await expect(secondPage.getByText(`${title} updated`, { exact: true })).toBeVisible();
    } finally {
      const context = await workspaceContext(page);
      await deleteObjects(
        page,
        context.objects.filter((object) => created.changedIds.includes(object._id)),
      );
      await secondContext.close();
    }
  });

  test('8–11: ordinary, @Role, and @team comments route exactly as specified', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Routing flow runs once on desktop Chromium.');
    await page.goto(workspacePath!);
    const before = await workspaceContext(page);
    const role = before.roles[0];
    expect(role).toBeTruthy();

    const ordinaryBody = `Ordinary note ${acceptanceKey('comment')}`;
    const ordinary = await callWebMcp<{ state: string }>(page, 'add_comment', {
      workspaceId,
      target: { kind: 'workspace' },
      body: ordinaryBody,
      idempotencyKey: acceptanceKey('ordinary-comment'),
    });
    expect(ordinary.state).toBe('unassigned');

    const unowned = await callWebMcp<{ changedIds: string[] }>(page, 'apply_canvas_changes', {
      workspaceId,
      idempotencyKey: acceptanceKey('unowned-comment-target'),
      changes: [
        {
          command: 'create_object',
          objectType: 'sticky',
          title: `Unowned note ${acceptanceKey('title')}`,
          placement: {
            position: { x: 8_400, y: 8_400 },
            size: { width: 260, height: 160 },
          },
          semantics: { semanticType: 'note', projectArea: 'product' },
        },
      ],
    });
    const unownedResult = await callWebMcp<{ state: string }>(page, 'add_comment', {
      workspaceId,
      target: { kind: 'object', objectId: unowned.changedIds[0]! },
      body: `Ownerless note ${acceptanceKey('body')}`,
      idempotencyKey: acceptanceKey('unowned-object-comment'),
    });
    expect(unownedResult.state).toBe('unassigned');

    const roleResult = await callWebMcp<{ state: string }>(page, 'add_comment', {
      workspaceId,
      target: { kind: 'workspace' },
      body: `@${role!.handle} Report one bounded acceptance update.`,
      idempotencyKey: acceptanceKey('role-comment'),
    });
    expect(roleResult.state).toBe('queued');

    const teamResult = await callWebMcp<{ state: string }>(page, 'add_comment', {
      workspaceId,
      target: { kind: 'workspace' },
      body: '@team Inspect acceptance state; do not modify project source.',
      idempotencyKey: acceptanceKey('team-comment'),
    });
    expect(teamResult.state).toBe('queued');

    await page.getByRole('button', { name: 'Comments' }).click();
    await expect(page.getByText(ordinaryBody, { exact: true })).toBeVisible();
    const after = await workspaceContext(page);
    const newRuns = after.runs.filter(
      (candidate) => !before.runs.some((existing) => existing.run._id === candidate.run._id),
    );
    expect(newRuns).toHaveLength(2);
    for (const candidate of newRuns) {
      if (candidate.run.state === 'active') {
        await callWebMcp(page, 'stop_run', {
          workspaceId,
          runId: candidate.run._id,
          idempotencyKey: acceptanceKey('routing-stop'),
        });
      }
    }
    const finalContext = await workspaceContext(page);
    await deleteObjects(
      page,
      finalContext.objects.filter((object) => unowned.changedIds.includes(object._id)),
    );
  });

  test('12: creates, edits, and removes a Role Profile and reusable Team through visible UI', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Mutation flow runs once on desktop Chromium.');
    await page.goto(workspacePath!);
    const roleName = `Acceptance Reviewer ${Date.now()}`;
    const updatedRoleName = `${roleName} Updated`;
    await page.getByRole('button', { name: 'Team', exact: true }).click();
    const addRoleSection = page
      .getByRole('heading', { name: 'Add Role Profile', exact: true })
      .locator('..');
    await addRoleSection.getByLabel('Name').fill(roleName);
    await addRoleSection.getByLabel('Handle').fill(`acceptance-${Date.now()}`);
    await addRoleSection
      .getByLabel('Responsibility')
      .fill('Validate connected browser acceptance.');
    await addRoleSection
      .getByLabel('Instructions')
      .fill('Report only bounded acceptance evidence.');
    await addRoleSection.getByLabel('Engine').selectOption('codex');
    await addRoleSection.getByRole('button', { name: 'Add Role Profile' }).click();
    await expect
      .poll(async () => (await workspaceContext(page)).roles.some((role) => role.name === roleName))
      .toBe(true);
    const createdRole = (await workspaceContext(page)).roles.find(
      (role) => role.name === roleName,
    )!;
    const roleDetail = page.locator('details').filter({ hasText: roleName });
    await expect(roleDetail).toBeVisible();
    await roleDetail.locator('summary').click();
    await roleDetail.getByLabel('Name').fill(updatedRoleName);
    await roleDetail.getByRole('button', { name: 'Save Role Profile' }).click();
    await expect(roleDetail.locator('summary')).toContainText(updatedRoleName);
    await roleDetail.getByRole('button', { name: 'Remove Role Profile' }).click();
    await expect(page.getByText(updatedRoleName, { exact: true })).toHaveCount(0);

    const context = await workspaceContext(page);
    const codexRole = context.roles.find(
      (role) => role.engine === 'codex' && role.staticDependencyRoleProfileIds.length === 0,
    );
    const claudeRole = context.roles.find(
      (role) => role.engine === 'claude' && role.staticDependencyRoleProfileIds.length === 0,
    );
    expect(codexRole, 'dependency-free Codex Role Profile').toBeTruthy();
    expect(claudeRole, 'dependency-free Claude Role Profile').toBeTruthy();

    const selected = new Set([codexRole!._id, claudeRole!._id]);
    for (const role of context.roles) {
      const checkbox = page.getByRole('checkbox', { name: new RegExp(role.name) });
      if ((await checkbox.isChecked()) !== selected.has(role._id)) await checkbox.click();
    }
    await page.getByLabel('Team name').fill(acceptanceTeamName);
    await page.getByRole('button', { name: 'Save selected roles as team' }).click();
    await expect(page.getByText(acceptanceTeamName, { exact: true })).toBeVisible();
    await expect
      .poll(async () =>
        (await workspaceContext(page)).teams.find((team) => team.name === acceptanceTeamName),
      )
      .toMatchObject({ roleProfileIds: expect.arrayContaining([...selected]) });
    if (process.env.GUILD_E2E_LIVE_RUNNER !== '1') {
      const card = page.locator('article').filter({ hasText: acceptanceTeamName });
      await card.getByRole('button', { name: 'Remove team' }).click();
      await expect(page.getByText(acceptanceTeamName, { exact: true })).toHaveCount(0);
    }
    const after = await workspaceContext(page);
    await deleteObjects(
      page,
      after.objects.filter((object) => object._id === createdRole.ownedSectionId),
    );
  });

  test('13–18: two engines receive distinct regions and an active run can be stopped', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runner flow runs once on desktop Chromium.');
    test.skip(
      process.env.GUILD_E2E_LIVE_RUNNER !== '1',
      'Requires the paired local Runner online.',
    );
    await page.goto(workspacePath!);
    const runnerStatus = await callWebMcp<{
      runners: Array<{
        _id: string;
        name: string;
        status: string;
        configuredConcurrency: number;
        engines: Array<{ engine: string; authState: string; version: string }>;
      }>;
    }>(page, 'get_runner_status', { workspaceId });
    const runner = runnerStatus.runners.find(
      (candidate) => candidate.status === 'online' || candidate.status === 'busy',
    );
    expect(runner).toBeTruthy();
    expect(runner!.configuredConcurrency).toBeGreaterThanOrEqual(2);
    expect(runner!.engines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ engine: 'codex', authState: 'ready' }),
        expect.objectContaining({ engine: 'claude', authState: 'ready' }),
      ]),
    );
    await page.getByRole('button', { name: 'Guild Runner', exact: true }).click();
    const originalRunnerName = runner!.name;
    const acceptanceRunnerName = `${originalRunnerName} · acceptance`;
    await page.getByLabel('Runner name').fill(acceptanceRunnerName);
    await page.getByRole('button', { name: 'Rename' }).click();
    await expect(page.getByLabel('Runner name')).toHaveValue(acceptanceRunnerName);

    const context = await workspaceContext(page);
    const team = context.teams.find((candidate) => candidate.name === acceptanceTeamName);
    expect(team).toBeTruthy();
    let runId: string | null = null;
    const brief = `Concurrent acceptance ${acceptanceKey('brief')}: inspect only; do not edit source.`;
    try {
      const started = await callWebMcp<{ runId: string }>(page, 'run_ai_team', {
        workspaceId,
        teamId: team!._id,
        brief,
        idempotencyKey: acceptanceKey('runner-run'),
      });
      runId = started.runId;
      await expect
        .poll(
          async () => {
            const current = await callWebMcp<{ jobs: ContextRun['jobs'] }>(page, 'get_run_status', {
              workspaceId,
              runId: started.runId,
            });
            return (
              current.jobs.length === 2 &&
              current.jobs.every(
                (job) => job.reservation && ['leased', 'running'].includes(job.state),
              )
            );
          },
          { timeout: 120_000 },
        )
        .toBe(true);
      const current = await callWebMcp<{ jobs: ContextRun['jobs'] }>(page, 'get_run_status', {
        workspaceId,
        runId: started.runId,
      });
      expect(current.jobs).toHaveLength(2);
      expect(new Set(current.jobs.map((job) => job.engine))).toEqual(new Set(['codex', 'claude']));
      const [first, second] = current.jobs;
      expect(first?.reservation).toBeTruthy();
      expect(second?.reservation).toBeTruthy();
      expect(rectanglesIntersect(first!.reservation!.bounds, second!.reservation!.bounds)).toBe(
        false,
      );
    } finally {
      if (runId) {
        const status = await callWebMcp<{ state: string }>(page, 'get_run_status', {
          workspaceId,
          runId,
        });
        if (status.state === 'active') {
          const stopped = await callWebMcp<{ state: string }>(page, 'stop_run', {
            workspaceId,
            runId,
            idempotencyKey: acceptanceKey('runner-stop'),
          });
          expect(stopped.state).toBe('cancelled');
        }
      }
      await page.getByRole('button', { name: 'Team', exact: true }).click();
      const card = page.locator('article').filter({ hasText: acceptanceTeamName });
      if ((await card.count()) > 0) await card.getByRole('button', { name: 'Remove team' }).click();
      await page.getByRole('button', { name: 'Guild Runner', exact: true }).click();
      await page.getByLabel('Runner name').fill(originalRunnerName);
      await page.getByRole('button', { name: 'Rename' }).click();
    }
    await page.getByRole('button', { name: 'Runs & Jobs' }).click();
    const runCard = page.getByText(brief, { exact: true }).locator('..');
    await expect(runCard.getByText('cancelled', { exact: true })).toBeVisible();
  });

  test('pairs a Runner through the real protocol and rejects a Worker collision', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Protocol flow runs once on desktop Chromium.');
    test.skip(
      process.env.GUILD_E2E_RUNNER_PROTOCOL !== '1',
      'Requires explicit permission to pair and revoke an acceptance Runner.',
    );
    await page.goto(workspacePath!);
    const runnerName = `Guild protocol acceptance ${Date.now()}`;
    let runnerId: string | null = null;
    let runId: string | null = null;
    let humanObjectId: string | null = null;
    let workerObjectId: string | null = null;
    let assignment: ProtocolAssignment | null = null;
    try {
      const pairingResponse = await page.request.post('/api/runner/pairings', {
        data: {
          runnerName,
          concurrency: 1,
          engines: [{ engine: 'codex', status: 'available', version: 'acceptance-protocol' }],
        },
      });
      expect(pairingResponse.ok()).toBe(true);
      const pairing = (await pairingResponse.json()) as {
        pairingId: string;
        deviceCode: string;
        userCode: string;
        verificationUrl: string;
      };

      await page.goto(pairing.verificationUrl);
      await expect(page.getByRole('heading', { name: 'Pair Guild Runner' })).toBeVisible();
      await expect(page.getByLabel('Pairing code')).toHaveValue(pairing.userCode);
      await page.getByRole('button', { name: 'Approve Runner' }).click();
      await expect(page.getByText(/Runner approved/)).toBeVisible();

      const exchangeResponse = await page.request.post('/api/runner/pairings/exchange', {
        data: { pairingId: pairing.pairingId, deviceCode: pairing.deviceCode },
      });
      expect(exchangeResponse.ok()).toBe(true);
      const exchange = (await exchangeResponse.json()) as {
        runnerId: string;
        runnerToken: string;
      };
      runnerId = exchange.runnerId;

      const poll = async () => {
        const response = await page.request.post('/api/runner/poll', {
          headers: { authorization: `Bearer ${exchange.runnerToken}` },
          data: {
            runnerVersion: 'acceptance-protocol',
            configuredConcurrency: 1,
            freeCapacity: 1,
            engines: [{ engine: 'codex', status: 'available', version: 'acceptance-protocol' }],
            activeAssignments: [],
            progress: [],
          },
        });
        expect(response.ok()).toBe(true);
        return (await response.json()) as { assignments: ProtocolAssignment[] };
      };
      await poll();

      await page.goto(workspacePath!);
      const runnerStatus = await callWebMcp<{
        runners: Array<{ _id: string; name: string; status: string }>;
      }>(page, 'get_runner_status', { workspaceId });
      expect(runnerStatus.runners).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: runnerId, name: runnerName, status: 'online' }),
        ]),
      );

      const before = await workspaceContext(page);
      const role = before.roles.find(
        (candidate) => candidate.engine === 'codex' && candidate.ownedSectionId,
      );
      expect(role).toBeTruthy();
      const routed = await callWebMcp<{ state: string }>(page, 'add_comment', {
        workspaceId,
        target: { kind: 'object', objectId: role!.ownedSectionId },
        body: `Run the bounded collision acceptance ${acceptanceKey('collision')}.`,
        idempotencyKey: acceptanceKey('collision-comment'),
      });
      expect(routed.state).toBe('queued');
      await expect
        .poll(async () => {
          const current = await workspaceContext(page);
          return current.runs.find(
            (candidate) => !before.runs.some((existing) => existing.run._id === candidate.run._id),
          )?.run._id;
        })
        .toBeTruthy();
      const afterRoute = await workspaceContext(page);
      runId = afterRoute.runs.find(
        (candidate) => !before.runs.some((existing) => existing.run._id === candidate.run._id),
      )!.run._id;

      const leased = await poll();
      expect(leased.assignments).toHaveLength(1);
      assignment = leased.assignments[0]!;
      expect(assignment.runId).toBe(runId);
      expect(assignment.expectedArtifactTypes).toContain('sticky');

      const workerContextResponse = await page.request.post(assignment.mcpEndpoint, {
        headers: assignmentHeaders(assignment),
        data: { tool: 'get_workspace_context', arguments: { limit: 200 } },
      });
      expect(workerContextResponse.ok()).toBe(true);
      const workerContext = (await workerContextResponse.json()) as {
        assignment: {
          reservedRegion: { x: number; y: number; width: number; height: number };
        };
      };
      const region = workerContext.assignment.reservedRegion;

      const workerCreateResponse = await page.request.post(assignment.mcpEndpoint, {
        headers: assignmentHeaders(assignment),
        data: {
          tool: 'apply_canvas_changes',
          arguments: {
            idempotencyKey: acceptanceKey('worker-create'),
            commands: [
              {
                type: 'create_object',
                objectType: 'sticky',
                title: 'Worker collision probe',
                content: { text: 'Worker-owned acceptance object' },
                size: { width: 240, height: 144 },
                logicalKey: acceptanceKey('worker-object'),
              },
            ],
          },
        },
      });
      expect(workerCreateResponse.ok()).toBe(true);
      workerObjectId = ((await workerCreateResponse.json()) as { changedIds: string[] })
        .changedIds[0]!;

      const collisionPosition = {
        x: region.x + region.width - 360,
        y: region.y + region.height - 264,
      };
      const humanCreate = await callWebMcp<{ changedIds: string[] }>(page, 'apply_canvas_changes', {
        workspaceId,
        idempotencyKey: acceptanceKey('human-collision-target'),
        changes: [
          {
            command: 'create_object',
            objectType: 'sticky',
            title: 'Human collision target',
            placement: {
              position: collisionPosition,
              size: { width: 240, height: 144 },
            },
          },
        ],
      });
      humanObjectId = humanCreate.changedIds[0]!;

      const collisionResponse = await page.request.post(assignment.mcpEndpoint, {
        headers: assignmentHeaders(assignment),
        data: {
          tool: 'apply_canvas_changes',
          arguments: {
            idempotencyKey: acceptanceKey('worker-collision'),
            commands: [
              {
                type: 'move_object',
                objectId: workerObjectId,
                position: collisionPosition,
                expectedRevision: 0,
              },
            ],
          },
        },
      });
      expect(collisionResponse.status()).toBe(409);
      await expect(collisionResponse.json()).resolves.toEqual({ error: 'reservation_collision' });
    } finally {
      if (assignment && workerObjectId) {
        await page.request.post(assignment.mcpEndpoint, {
          headers: assignmentHeaders(assignment),
          data: {
            tool: 'apply_canvas_changes',
            arguments: {
              idempotencyKey: acceptanceKey('worker-cleanup'),
              commands: [{ type: 'delete_object', objectId: workerObjectId, expectedRevision: 0 }],
            },
          },
        });
      }
      await page.goto(workspacePath!);
      if (humanObjectId) {
        const current = await workspaceContext(page);
        await deleteObjects(
          page,
          current.objects.filter((object) => object._id === humanObjectId),
        );
      }
      if (runId) {
        const status = await callWebMcp<{ state: string }>(page, 'get_run_status', {
          workspaceId,
          runId,
        });
        if (status.state === 'active') {
          await callWebMcp(page, 'stop_run', {
            workspaceId,
            runId,
            idempotencyKey: acceptanceKey('collision-stop'),
          });
        }
      }
      if (runnerId) {
        await page.getByRole('button', { name: 'Guild Runner', exact: true }).click();
        const runnerCard = page.locator('article').filter({ hasText: runnerName });
        await runnerCard.getByRole('button', { name: 'Revoke' }).click();
        await expect(runnerCard.getByText('Revoked', { exact: true })).toBeVisible();
      }
    }
  });

  test('direct WebMCP mutations reject stale revisions and agree with visible UI', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Control flow runs once on desktop Chromium.');
    await page.goto(workspacePath!);
    const title = `Visible WebMCP ${acceptanceKey('object')}`;
    const created = await callWebMcp<{ changeSetId: string; changedIds: string[] }>(
      page,
      'apply_canvas_changes',
      {
        workspaceId,
        idempotencyKey: acceptanceKey('visible-webmcp'),
        changes: [
          {
            command: 'create_object',
            type: 'sticky',
            title,
            positionHint: { x: 320, y: 320 },
            coordinateSpace: 'canvas',
            size: { width: 240, height: 168 },
            style: { palette: 'mint' },
            semantics: { semanticType: 'acceptance-evidence', projectArea: 'testing' },
          },
        ],
      },
    );
    expect(created.changeSetId).toBeTruthy();
    try {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
      const current = await workspaceContext(page);
      const object = current.objects.find((candidate) => candidate._id === created.changedIds[0]);
      expect(object).toBeTruthy();
      await callWebMcp(page, 'apply_canvas_changes', {
        workspaceId,
        idempotencyKey: acceptanceKey('fresh-revision'),
        changes: [
          {
            command: 'update_object',
            objectId: object!._id,
            segment: 'content',
            expectedRevision: object!.contentRevision,
            patch: { text: 'Fresh human-visible revision' },
          },
        ],
      });
      await expect(
        callWebMcp(page, 'apply_canvas_changes', {
          workspaceId,
          idempotencyKey: acceptanceKey('stale-revision'),
          changes: [
            {
              command: 'update_object',
              objectId: object!._id,
              segment: 'content',
              expectedRevision: object!.contentRevision,
              patch: { text: 'Stale overwrite must fail' },
            },
          ],
        }),
      ).rejects.toThrow(/revision_conflict/);
      const search = await callWebMcp<{ results: ContextObject[] }>(page, 'search_canvas', {
        workspaceId,
        query: title,
        limit: 5,
      });
      expect(search.results.some((object) => object._id === created.changedIds[0])).toBe(true);
    } finally {
      const current = await workspaceContext(page);
      await deleteObjects(
        page,
        current.objects.filter((object) => created.changedIds.includes(object._id)),
      );
    }
  });

  test('retries one explicit failed Job fixture', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Control flow runs once on desktop Chromium.');
    test.skip(!failedJobId, 'Requires GUILD_E2E_FAILED_JOB_ID for deterministic retry proof.');
    await page.goto(workspacePath!);
    const before = await workspaceContext(page);
    const failed = before.runs.flatMap((row) => row.jobs).find((job) => job._id === failedJobId);
    expect(failed).toMatchObject({ state: 'failed' });
    const retried = await callWebMcp<{ jobId: string; state: string }>(page, 'retry_job', {
      workspaceId,
      jobId: failedJobId!,
      idempotencyKey: acceptanceKey('retry'),
    });
    expect(retried).toMatchObject({ jobId: failedJobId, state: 'queued' });
    const owningRun = before.runs.find((row) => row.jobs.some((job) => job._id === failedJobId));
    expect(owningRun).toBeTruthy();
    const status = await callWebMcp<{ state: string }>(page, 'get_run_status', {
      workspaceId,
      runId: owningRun!.run._id,
    });
    if (status.state === 'active') {
      await callWebMcp(page, 'stop_run', {
        workspaceId,
        runId: owningRun!.run._id,
        idempotencyKey: acceptanceKey('retry-stop'),
      });
    }
  });

  test('undo preserves a later human edit on an explicit completed-Run fixture', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Control flow runs once on desktop Chromium.');
    test.skip(
      !undoRunId || !undoObjectId,
      'Requires a completed Run and its pre-existing Worker-edited object fixture.',
    );
    await page.goto(workspacePath!);
    const before = await workspaceContext(page);
    const object = before.objects.find((candidate) => candidate._id === undoObjectId);
    const run = before.runs.find((candidate) => candidate.run._id === undoRunId);
    expect(object).toBeTruthy();
    expect(run?.run.state).toBe('completed');
    await callWebMcp(page, 'apply_canvas_changes', {
      workspaceId,
      idempotencyKey: acceptanceKey('post-run-human-edit'),
      changes: [
        {
          command: 'update_object',
          objectId: object!._id,
          segment: 'content',
          expectedRevision: object!.contentRevision,
          patch: { text: `Preserve this human edit ${Date.now()}` },
        },
      ],
    });
    const result = await callWebMcp<{ skippedConflicts: unknown[] }>(page, 'undo_run', {
      workspaceId,
      runId: undoRunId!,
      idempotencyKey: acceptanceKey('undo-run'),
    });
    expect(result.skippedConflicts.length).toBeGreaterThan(0);
    const after = await workspaceContext(page);
    const preserved = after.objects.find((candidate) => candidate._id === undoObjectId);
    expect(preserved?.contentRevision).toBeGreaterThan(object!.contentRevision);
  });

  test('production smoke keeps the canvas useful and console clean', async ({ page }, testInfo) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Production smoke requires PLAYWRIGHT_BASE_URL.');
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(workspacePath!);
    await expect(page.getByLabel(/infinite canvas/i)).toBeVisible();
    await expect(page.getByText('Live WebMCP ready')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
    expect(errors, testInfo.project.name).toEqual([]);
  });
});
