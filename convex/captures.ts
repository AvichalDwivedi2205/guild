import { assertPublicHttpUrl } from '@guild/protocol';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';
import { randomToken, sha256 } from './lib/crypto';
import { requireRunner } from './lib/runnerAuth';

const CAPTURE_LEASE_MS = 60_000;
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

function urlPolicy() {
  return {
    allowLoopback: process.env.NODE_ENV !== 'production',
  };
}

export const claimPreviewCaptures = mutation({
  args: {
    runnerToken: v.string(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.capacity < 1 || args.capacity > 4) throw new Error('invalid_capture_capacity');
    const runner = await requireRunner(ctx, args.runnerToken);
    const now = Date.now();
    const leased = await ctx.db
      .query('previewCaptureTasks')
      .withIndex('by_runnerId_and_state', (query) =>
        query.eq('runnerId', runner._id).eq('state', 'leased'),
      )
      .take(8);
    for (const task of leased) {
      if (task.expiresAt && task.expiresAt <= now) {
        await ctx.db.patch(task._id, {
          state: 'queued',
          runnerId: undefined,
          expiresAt: undefined,
          updatedAt: now,
        });
      }
    }

    const claimed = [];
    const queued = await ctx.db
      .query('previewCaptureTasks')
      .withIndex('by_state_and_expiry', (query) => query.eq('state', 'queued'))
      .take(20);
    for (const task of queued) {
      if (claimed.length >= args.capacity) break;
      if (!runner.allowedWorkspaceIds.includes(task.workspaceId)) continue;
      const screenRevision = await ctx.db.get(task.designScreenRevisionId);
      if (!screenRevision) continue;
      const revision = await ctx.db.get(screenRevision.designRevisionId);
      const screen = await ctx.db.get(screenRevision.designScreenId);
      if (!revision || !screen) continue;
      const captureUrl = new URL(screenRevision.route, `${revision.origin}/`).toString();
      try {
        assertPublicHttpUrl(captureUrl, urlPolicy());
      } catch {
        await ctx.db.patch(task._id, {
          state: 'failed',
          error: 'unsafe_url',
          updatedAt: now,
        });
        continue;
      }
      const capabilityToken = randomToken();
      const fencingToken = task.fencingToken + 1;
      await ctx.db.patch(task._id, {
        state: 'leased',
        runnerId: runner._id,
        attempt: task.attempt + 1,
        fencingToken,
        expiresAt: now + CAPTURE_LEASE_MS,
        capabilityTokenHash: await sha256(capabilityToken),
        updatedAt: now,
      });
      claimed.push({
        taskId: task._id,
        workspaceId: task.workspaceId,
        designRevisionId: revision._id,
        designScreenRevisionId: screenRevision._id,
        screenKey: screen.key,
        route: screenRevision.route,
        captureUrl,
        origin: revision.origin,
        viewportKey: task.viewportKey,
        viewport: VIEWPORTS[task.viewportKey],
        attempt: task.attempt + 1,
        fencingToken,
        capabilityToken,
        expiresAt: now + CAPTURE_LEASE_MS,
      });
    }
    return { tasks: claimed };
  },
});

export const completePreviewCapture = mutation({
  args: {
    runnerToken: v.string(),
    taskId: v.id('previewCaptureTasks'),
    capabilityToken: v.string(),
    attempt: v.number(),
    fencingToken: v.number(),
    viewportAssetId: v.id('assets'),
    fullPageAssetId: v.optional(v.id('assets')),
    thumbnailAssetId: v.optional(v.id('assets')),
  },
  handler: async (ctx, args) => {
    const runner = await requireRunner(ctx, args.runnerToken);
    const task = await ctx.db.get(args.taskId);
    if (
      !task ||
      task.runnerId !== runner._id ||
      task.state !== 'leased' ||
      task.attempt !== args.attempt ||
      task.fencingToken !== args.fencingToken
    ) {
      throw new Error('stale_authority');
    }
    if (task.capabilityTokenHash !== (await sha256(args.capabilityToken))) {
      throw new Error('invalid_capture_capability');
    }
    const viewportAsset = await ctx.db.get(args.viewportAssetId);
    if (
      !viewportAsset ||
      viewportAsset.workspaceId !== task.workspaceId ||
      viewportAsset.status !== 'ready'
    ) {
      throw new Error('asset_not_found');
    }
    const now = Date.now();
    await ctx.db.patch(task._id, {
      state: 'completed',
      viewportAssetId: args.viewportAssetId,
      ...(args.fullPageAssetId ? { fullPageAssetId: args.fullPageAssetId } : {}),
      ...(args.thumbnailAssetId ? { thumbnailAssetId: args.thumbnailAssetId } : {}),
      updatedAt: now,
    });
    const siblings = await ctx.db
      .query('previewCaptureTasks')
      .withIndex('by_designScreenRevisionId', (query) =>
        query.eq('designScreenRevisionId', task.designScreenRevisionId),
      )
      .take(4);
    const ready = siblings.every(
      (sibling) => sibling._id === task._id || sibling.state === 'completed',
    );
    if (ready) {
      await ctx.db.patch(task.designScreenRevisionId, { captureReady: true });
      const screenRevision = await ctx.db.get(task.designScreenRevisionId);
      if (screenRevision) {
        const screen = await ctx.db.get(screenRevision.designScreenId);
        if (screen) {
          await ctx.db.patch(screen.canvasObjectId, {
            contentPreview: {
              kind: 'design_screen',
              viewportAssetId: args.viewportAssetId,
              captureReady: true,
            },
            updatedAt: now,
          });
        }
      }
    }
    return { taskId: task._id, captureReady: ready };
  },
});

export const failPreviewCapture = mutation({
  args: {
    runnerToken: v.string(),
    taskId: v.id('previewCaptureTasks'),
    capabilityToken: v.string(),
    attempt: v.number(),
    fencingToken: v.number(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const runner = await requireRunner(ctx, args.runnerToken);
    const task = await ctx.db.get(args.taskId);
    if (
      !task ||
      task.runnerId !== runner._id ||
      task.state !== 'leased' ||
      task.attempt !== args.attempt ||
      task.fencingToken !== args.fencingToken
    ) {
      throw new Error('stale_authority');
    }
    if (task.capabilityTokenHash !== (await sha256(args.capabilityToken))) {
      throw new Error('invalid_capture_capability');
    }
    await ctx.db.patch(task._id, {
      state: 'failed',
      error: args.error.slice(0, 500),
      updatedAt: Date.now(),
    });
    return { taskId: task._id as Id<'previewCaptureTasks'> };
  },
});
