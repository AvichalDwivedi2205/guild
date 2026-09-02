// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const ownerIdentity = {
  subject: 'workos_asset_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_asset_owner',
  name: 'Asset Owner',
};

const readyEngines = [
  { engine: 'codex' as const, version: 'test-codex', authState: 'ready' as const },
];

describe('Convex assets and capture tasks', () => {
  it('starts an upload intent and claims then fails a queued capture honestly', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(ownerIdentity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Asset workspace',
    });
    const intent = await asOwner.mutation(api.assets.beginAssetUpload, {
      workspaceId,
      kind: 'upload',
    });
    expect(intent.uploadUrl).toMatch(/^https?:\/\//u);
    expect(intent.intentId).toBeTruthy();

    await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:capture:0001',
      designSetKey: 'cinema-capture',
      title: 'Capture set',
      stage: 'visual',
      deploymentId: 'dep_capture_v1',
      deploymentUrl: 'https://preview.example.com/cinema',
      origin: 'https://preview.example.com',
      screens: [
        {
          screenKey: 'landing',
          name: 'Landing',
          route: '/',
          order: 0,
          viewports: ['desktop'],
        },
      ],
    });

    const pairing = await t.mutation(api.runners.beginPairing, {
      runnerName: 'Capture Runner',
      configuredConcurrency: 1,
      engines: readyEngines,
    });
    await t.mutation(api.runners.exchangePairing, {
      pairingId: pairing.pairingId,
      deviceCode: pairing.deviceCode,
    });
    await asOwner.mutation(api.runners.approvePairing, {
      userCode: pairing.userCode.toLowerCase(),
      allowedWorkspaceIds: [workspaceId],
    });
    const exchanged = await t.mutation(api.runners.exchangePairing, {
      pairingId: pairing.pairingId,
      deviceCode: pairing.deviceCode,
    });
    if (!exchanged) throw new Error('runner_not_exchanged');

    const claimed = await t.mutation(api.captures.claimPreviewCaptures, {
      runnerToken: exchanged.runnerToken,
      capacity: 2,
    });
    expect(claimed.tasks).toHaveLength(1);
    expect(claimed.tasks[0]?.captureUrl).toBe('https://preview.example.com/');
    expect(claimed.tasks[0]?.viewport).toEqual({ width: 1440, height: 900 });

    const failed = await t.mutation(api.captures.failPreviewCapture, {
      runnerToken: exchanged.runnerToken,
      taskId: claimed.tasks[0]!.taskId,
      capabilityToken: claimed.tasks[0]!.capabilityToken,
      attempt: claimed.tasks[0]!.attempt,
      fencingToken: claimed.tasks[0]!.fencingToken,
      error: 'capture_browser_unavailable',
    });
    expect(failed.taskId).toBe(claimed.tasks[0]!.taskId);

    const status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'cinema-capture',
    });
    expect(status?.captures[0]?.state).toBe('failed');
    expect(status?.captures[0]?.error).toBe('capture_browser_unavailable');
  });
});
