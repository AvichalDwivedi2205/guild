import { assertPublicHttpUrl } from '@guild/protocol';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { assertAssetLimits, assertSniffedAsset } from './assets';
import { convexAssetStore } from './lib/assetStore';
import { randomToken, sha256 } from './lib/crypto';
import { requireRunner } from './lib/runnerAuth';

const CAPTURE_LEASE_MS = 3 * 60_000;
const CAPTURE_UPLOAD_TTL_MS = 15 * 60_000;
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

const captureAssetKindValidator = v.union(
  v.literal('viewport'),
  v.literal('full_page'),
  v.literal('thumbnail'),
);

function urlPolicy() {
  return {
    allowLoopback: process.env.NODE_ENV !== 'production',
  };
}

function hexToBase64(value: string): string {
  const bytes = value.match(/.{2}/gu)?.map((pair) => Number.parseInt(pair, 16)) ?? [];
  return btoa(String.fromCharCode(...bytes));
}

type CaptureAuthority = {
  runnerToken: string;
  taskId: Id<'previewCaptureTasks'>;
  capabilityToken: string;
  attempt: number;
  fencingToken: number;
};

async function requireCaptureAuthority(
  ctx: Pick<MutationCtx, 'db'> | Pick<QueryCtx, 'db'>,
  args: CaptureAuthority,
) {
  const runner = await requireRunner(ctx, args.runnerToken);
  const task = await ctx.db.get(args.taskId);
  if (
    !task ||
    task.runnerId !== runner._id ||
    task.state !== 'leased' ||
    task.attempt !== args.attempt ||
    task.fencingToken !== args.fencingToken ||
    !task.expiresAt ||
    task.expiresAt <= Date.now()
  ) {
    throw new Error('stale_authority');
  }
  if (task.capabilityTokenHash !== (await sha256(args.capabilityToken))) {
    throw new Error('invalid_capture_capability');
  }
  return { runner, task };
}

async function completeCapturedTask(
  ctx: MutationCtx,
  task: Doc<'previewCaptureTasks'>,
  assets: {
    viewportAssetId: Id<'assets'>;
    fullPageAssetId?: Id<'assets'>;
    thumbnailAssetId?: Id<'assets'>;
  },
) {
  const now = Date.now();
  await ctx.db.patch(task._id, {
    state: 'completed',
    ...assets,
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
    const desktopAssetId = siblings.find(
      (sibling) => sibling.viewportKey === 'desktop' && sibling.viewportAssetId,
    )?.viewportAssetId;
    await ctx.db.patch(task.designScreenRevisionId, { captureReady: true });
    const screenRevision = await ctx.db.get(task.designScreenRevisionId);
    if (screenRevision) {
      const screen = await ctx.db.get(screenRevision.designScreenId);
      if (screen) {
        await ctx.db.patch(screen.canvasObjectId, {
          contentPreview: {
            kind: 'design_screen',
            viewportAssetId: desktopAssetId ?? assets.viewportAssetId,
            captureReady: true,
          },
          updatedAt: now,
        });
      }
    }
  }
  return { taskId: task._id, captureReady: ready };
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

export const beginPreviewCaptureUpload = mutation({
  args: {
    runnerToken: v.string(),
    taskId: v.id('previewCaptureTasks'),
    capabilityToken: v.string(),
    attempt: v.number(),
    fencingToken: v.number(),
    kind: captureAssetKindValidator,
    byteSize: v.number(),
  },
  handler: async (ctx, args) => {
    const { runner, task } = await requireCaptureAuthority(ctx, args);
    assertAssetLimits({ byteSize: args.byteSize, width: 1, height: 1 });
    const now = Date.now();
    const uploadUrl = await convexAssetStore(ctx).generateUploadUrl();
    const intentId = await ctx.db.insert('assetUploadIntents', {
      workspaceId: task.workspaceId,
      expectedKind: args.kind,
      maxBytes: args.byteSize,
      state: 'pending',
      expiresAt: now + CAPTURE_UPLOAD_TTL_MS,
      createdByRunnerId: runner._id,
      captureTaskId: task._id,
      createdAt: now,
    });
    await ctx.scheduler.runAt(
      now + CAPTURE_UPLOAD_TTL_MS,
      internal.captureCleanup.expireUploadIntent,
      { intentId },
    );
    return { intentId, uploadUrl, expiresAt: now + CAPTURE_UPLOAD_TTL_MS };
  },
});

const completePreviewCaptureUploadArgs = {
  runnerToken: v.string(),
  taskId: v.id('previewCaptureTasks'),
  capabilityToken: v.string(),
  attempt: v.number(),
  fencingToken: v.number(),
  intentId: v.id('assetUploadIntents'),
  storageId: v.id('_storage'),
  checksum: v.string(),
  byteSize: v.number(),
  altText: v.string(),
};

async function requireCaptureUploadIntent(
  ctx: Pick<MutationCtx, 'db'> | Pick<QueryCtx, 'db'>,
  args: CaptureAuthority & {
    intentId: Id<'assetUploadIntents'>;
    byteSize: number;
  },
) {
  const { runner, task } = await requireCaptureAuthority(ctx, args);
  const intent = await ctx.db.get(args.intentId);
  if (
    !intent ||
    intent.workspaceId !== task.workspaceId ||
    intent.createdByRunnerId !== runner._id ||
    intent.captureTaskId !== task._id ||
    !['viewport', 'full_page', 'thumbnail'].includes(intent.expectedKind) ||
    intent.state !== 'pending' ||
    intent.expiresAt <= Date.now() ||
    args.byteSize > intent.maxBytes
  ) {
    throw new Error('intent_expired');
  }
  return { runner, task, intent };
}

export const authorizePreviewCaptureUpload = internalQuery({
  args: completePreviewCaptureUploadArgs,
  handler: async (ctx, args) => {
    await requireCaptureUploadIntent(ctx, args);
    return { authorized: true };
  },
});

export const bindPreviewCaptureUpload = internalMutation({
  args: completePreviewCaptureUploadArgs,
  handler: async (ctx, args) => {
    const { intent } = await requireCaptureUploadIntent(ctx, args);
    if (intent.storageId && intent.storageId !== args.storageId) throw new Error('intent_expired');
    const stored = await ctx.db.system.get(args.storageId);
    if (!stored || stored.size !== args.byteSize) throw new Error('unsafe_asset');
    await ctx.db.patch(intent._id, { storageId: args.storageId });
    return { authorized: true };
  },
});

export const completePreviewCaptureUpload = action({
  args: completePreviewCaptureUploadArgs,
  handler: async (ctx, args): Promise<{ assetId: Id<'assets'> }> => {
    if (!/^[a-f0-9]{64}$/u.test(args.checksum)) throw new Error('unsafe_asset');
    await ctx.runQuery(internal.captures.authorizePreviewCaptureUpload, args);
    await ctx.runMutation(internal.captures.bindPreviewCaptureUpload, args);
    const blob = await ctx.storage.get(args.storageId);
    if (!blob || blob.size !== args.byteSize || blob.size > 5_000_000) {
      throw new Error('unsafe_asset');
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let header: ReturnType<typeof assertSniffedAsset>;
    try {
      header = assertSniffedAsset(bytes, blob.size);
    } catch {
      throw new Error('unsafe_asset');
    }
    if (header.mime !== 'image/png') throw new Error('unsafe_asset');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const checksum = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    if (checksum !== args.checksum) throw new Error('unsafe_asset');
    return await ctx.runMutation(internal.captures.finalizePreviewCaptureUpload, {
      ...args,
      mime: 'image/png',
      width: header.width,
      height: header.height,
    });
  },
});

export const finalizePreviewCaptureUpload = internalMutation({
  args: {
    ...completePreviewCaptureUploadArgs,
    width: v.number(),
    height: v.number(),
    mime: v.literal('image/png'),
  },
  handler: async (ctx, args) => {
    const { runner, task, intent } = await requireCaptureUploadIntent(ctx, args);
    assertAssetLimits(args);
    if (intent.storageId !== args.storageId) throw new Error('intent_expired');
    if (!/^[a-f0-9]{64}$/u.test(args.checksum)) throw new Error('unsafe_asset');
    const stored = await ctx.db.system.get(args.storageId);
    if (
      !stored ||
      stored.size !== args.byteSize ||
      (stored.sha256 !== args.checksum && stored.sha256 !== hexToBase64(args.checksum)) ||
      (stored.contentType && stored.contentType !== args.mime)
    ) {
      throw new Error('unsafe_asset');
    }
    const screenRevision = await ctx.db.get(task.designScreenRevisionId);
    if (!screenRevision || screenRevision.workspaceId !== task.workspaceId) {
      throw new Error('design_revision_not_found');
    }
    const assetId = await ctx.db.insert('assets', {
      workspaceId: task.workspaceId,
      storageId: args.storageId,
      kind: intent.expectedKind,
      mime: args.mime,
      byteSize: args.byteSize,
      width: args.width,
      height: args.height,
      checksum: args.checksum,
      altText: args.altText.slice(0, 200),
      provenance: 'runner_capture',
      sourceRunnerId: runner._id,
      designRevisionId: screenRevision.designRevisionId,
      designScreenRevisionId: screenRevision._id,
      status: 'ready',
      createdAt: Date.now(),
    });
    await ctx.db.patch(intent._id, {
      state: 'finalized',
      assetId,
      expiresAt: Date.now(),
    });
    return { assetId };
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
    const { task } = await requireCaptureAuthority(ctx, args);
    const expectedAssets = [
      ['viewport', args.viewportAssetId],
      ['full_page', args.fullPageAssetId],
      ['thumbnail', args.thumbnailAssetId],
    ] as const;
    for (const [kind, assetId] of expectedAssets) {
      if (!assetId) continue;
      const asset = await ctx.db.get(assetId);
      if (
        !asset ||
        asset.workspaceId !== task.workspaceId ||
        asset.designScreenRevisionId !== task.designScreenRevisionId ||
        asset.kind !== kind ||
        asset.status !== 'ready'
      ) {
        throw new Error('asset_not_found');
      }
    }
    return await completeCapturedTask(ctx, task, {
      viewportAssetId: args.viewportAssetId,
      ...(args.fullPageAssetId ? { fullPageAssetId: args.fullPageAssetId } : {}),
      ...(args.thumbnailAssetId ? { thumbnailAssetId: args.thumbnailAssetId } : {}),
    });
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
    retryable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { task } = await requireCaptureAuthority(ctx, args);
    const retry = args.retryable === true && task.attempt < 3;
    await ctx.db.patch(task._id, {
      state: retry ? 'queued' : 'failed',
      error: args.error.slice(0, 500),
      ...(retry
        ? {
            runnerId: undefined,
            expiresAt: undefined,
            capabilityTokenHash: undefined,
          }
        : {}),
      updatedAt: Date.now(),
    });
    return { taskId: task._id as Id<'previewCaptureTasks'> };
  },
});
