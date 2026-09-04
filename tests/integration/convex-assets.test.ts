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
  it('finalizes a task-scoped Runner upload into an authorized immutable capture', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(ownerIdentity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Captured design workspace',
    });
    const published = await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:capture:success:0001',
      designSetKey: 'capture-success',
      title: 'Captured design',
      stage: 'visual',
      deploymentId: 'dep_capture_success_v1',
      deploymentUrl: 'https://preview.example.com/',
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
      capacity: 1,
    });
    const task = claimed.tasks[0];
    if (!task) throw new Error('capture_not_claimed');
    const unsafeBytes = new TextEncoder().encode('<html><body>not a png capture</body></html>');
    const unsafeIntent = await t.mutation(api.captures.beginPreviewCaptureUpload, {
      runnerToken: exchanged.runnerToken,
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: task.attempt,
      fencingToken: task.fencingToken,
      kind: 'thumbnail',
      byteSize: unsafeBytes.byteLength,
    });
    const unsafeStored = await t.run(async (ctx) => ({
      storageId: await ctx.storage.store(new Blob([unsafeBytes], { type: 'text/html' })),
    }));
    const unsafeChecksum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', unsafeBytes))]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    await expect(
      t.action(api.captures.completePreviewCaptureUpload, {
        runnerToken: exchanged.runnerToken,
        taskId: task.taskId,
        capabilityToken: task.capabilityToken,
        attempt: task.attempt,
        fencingToken: task.fencingToken,
        intentId: unsafeIntent.intentId,
        storageId: unsafeStored.storageId,
        checksum: unsafeChecksum,
        byteSize: unsafeBytes.byteLength,
        altText: 'Unsafe fake preview',
      }),
    ).rejects.toThrow('unsafe_asset');
    const pngBytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      ),
      (character) => character.charCodeAt(0),
    );
    const intent = await t.mutation(api.captures.beginPreviewCaptureUpload, {
      runnerToken: exchanged.runnerToken,
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: task.attempt,
      fencingToken: task.fencingToken,
      kind: 'viewport',
      byteSize: pngBytes.byteLength,
    });
    expect(intent.uploadUrl).toMatch(/^https?:\/\//u);
    const checksum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', pngBytes))]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const stored = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob([pngBytes], { type: 'image/png' }));
      const metadata = await ctx.db.system.get(storageId);
      if (!metadata) throw new Error('storage_metadata_missing');
      return {
        storageId,
        storedChecksum: metadata.sha256,
        byteSize: metadata.size,
        contentType: metadata.contentType,
      };
    });
    expect(stored).toMatchObject({
      byteSize: pngBytes.byteLength,
    });
    expect(stored.storedChecksum).toBeTruthy();
    const foreignCapability = 'foreign_capture_capability_token';
    const foreignCapabilityHash = [
      ...new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(foreignCapability)),
      ),
    ]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const foreignTaskId = await t.run(async (ctx) => {
      const original = await ctx.db.get(task.taskId);
      if (!original?.runnerId) throw new Error('leased_capture_missing');
      return await ctx.db.insert('previewCaptureTasks', {
        workspaceId: original.workspaceId,
        designScreenRevisionId: original.designScreenRevisionId,
        viewportKey: original.viewportKey,
        state: 'leased',
        attempt: 1,
        fencingToken: 1,
        runnerId: original.runnerId,
        expiresAt: Date.now() + 60_000,
        capabilityTokenHash: foreignCapabilityHash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await expect(
      t.action(api.captures.completePreviewCaptureUpload, {
        runnerToken: exchanged.runnerToken,
        taskId: foreignTaskId,
        capabilityToken: foreignCapability,
        attempt: 1,
        fencingToken: 1,
        intentId: intent.intentId,
        storageId: stored.storageId,
        checksum,
        byteSize: stored.byteSize,
        altText: 'Cross-task preview swap',
      }),
    ).rejects.toThrow('intent_expired');
    await t.run(async (ctx) => await ctx.db.delete(foreignTaskId));
    const finalized = await t.action(api.captures.completePreviewCaptureUpload, {
      runnerToken: exchanged.runnerToken,
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: task.attempt,
      fencingToken: task.fencingToken,
      intentId: intent.intentId,
      storageId: stored.storageId,
      checksum,
      byteSize: stored.byteSize,
      altText: 'Landing desktop preview',
    });
    const completed = await t.mutation(api.captures.completePreviewCapture, {
      runnerToken: exchanged.runnerToken,
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: task.attempt,
      fencingToken: task.fencingToken,
      viewportAssetId: finalized.assetId,
    });
    expect(completed.captureReady).toBe(true);

    const status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'capture-success',
    });
    expect(status?.captureReady).toBe(true);
    expect(status?.captures[0]?.state).toBe('completed');
    const designSet = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'capture-success',
    });
    expect(designSet?.screenRevisions[0]?.captures[0]?.viewportAssetId).toBe(finalized.assetId);
    const context = await asOwner.query(api.canvas.getWorkspaceContext, {
      workspaceId,
      objectLimit: 50,
    });
    const screen = context.objects.find((object) => object._id === published.screenObjectIds[0]);
    expect(screen?.contentPreview).toEqual(
      expect.objectContaining({
        kind: 'design_screen',
        viewportAssetId: finalized.assetId,
        url: expect.stringMatching(/^https?:\/\//u),
      }),
    );
    const authorized = await asOwner.query(api.assets.getAuthorizedAssetUrl, {
      workspaceId,
      assetId: finalized.assetId,
    });
    expect(authorized.url).toMatch(/^https?:\/\//u);

    await expect(
      t.action(api.captures.completePreviewCaptureUpload, {
        runnerToken: exchanged.runnerToken,
        taskId: task.taskId,
        capabilityToken: task.capabilityToken,
        attempt: task.attempt,
        fencingToken: task.fencingToken,
        intentId: intent.intentId,
        storageId: stored.storageId,
        checksum,
        byteSize: stored.byteSize,
        altText: 'Landing desktop preview',
      }),
    ).rejects.toThrow('stale_authority');
  });

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

    await t.mutation(api.captures.failPreviewCapture, {
      runnerToken: exchanged.runnerToken,
      taskId: claimed.tasks[0]!.taskId,
      capabilityToken: claimed.tasks[0]!.capabilityToken,
      attempt: claimed.tasks[0]!.attempt,
      fencingToken: claimed.tasks[0]!.fencingToken,
      error: 'capture_upload_failed',
      retryable: true,
    });

    let status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'cinema-capture',
    });
    expect(status?.captures[0]?.state).toBe('queued');

    const retried = await t.mutation(api.captures.claimPreviewCaptures, {
      runnerToken: exchanged.runnerToken,
      capacity: 1,
    });
    expect(retried.tasks[0]?.attempt).toBe(2);
    const failed = await t.mutation(api.captures.failPreviewCapture, {
      runnerToken: exchanged.runnerToken,
      taskId: retried.tasks[0]!.taskId,
      capabilityToken: retried.tasks[0]!.capabilityToken,
      attempt: retried.tasks[0]!.attempt,
      fencingToken: retried.tasks[0]!.fencingToken,
      error: 'capture_browser_unavailable',
    });
    expect(failed.taskId).toBe(retried.tasks[0]!.taskId);

    status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'cinema-capture',
    });
    expect(status?.captures[0]?.state).toBe('failed');
    expect(status?.captures[0]?.error).toBe('capture_browser_unavailable');
  });
});
