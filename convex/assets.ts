import { sniffImageHeader } from '@guild/protocol';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { convexAssetStore } from './lib/assetStore';
import { requireRunner } from './lib/runnerAuth';

const MAX_ASSET_BYTES = 5_000_000;
const INTENT_TTL_MS = 15 * 60_000;

const assetKindValidator = v.union(
  v.literal('viewport'),
  v.literal('full_page'),
  v.literal('thumbnail'),
  v.literal('crop'),
  v.literal('upload'),
);

function assertAssetLimits(input: { byteSize: number; width: number; height: number }) {
  if (input.byteSize < 32 || input.byteSize > MAX_ASSET_BYTES) throw new Error('unsafe_asset');
  if (input.width < 1 || input.height < 1 || input.width * input.height > 16_000_000) {
    throw new Error('unsafe_asset');
  }
}

export function assertSniffedAsset(bytes: Uint8Array, byteSize: number) {
  const header = sniffImageHeader(bytes);
  assertAssetLimits({ byteSize, width: header.width, height: header.height });
  return header;
}

export const beginAssetUpload = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    kind: assetKindValidator,
    maxBytes: v.optional(v.number()),
    runnerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let createdByUserId: Id<'users'> | undefined;
    let createdByRunnerId: Id<'runners'> | undefined;
    if (args.runnerToken) {
      const runner = await requireRunner(ctx, args.runnerToken);
      if (!runner.allowedWorkspaceIds.includes(args.workspaceId)) {
        throw new Error('workspace_mismatch');
      }
      createdByRunnerId = runner._id;
    } else {
      const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
      createdByUserId = user._id;
    }
    const uploadUrl = await convexAssetStore(ctx).generateUploadUrl();
    const intentId = await ctx.db.insert('assetUploadIntents', {
      workspaceId: args.workspaceId,
      expectedKind: args.kind,
      maxBytes: Math.min(args.maxBytes ?? MAX_ASSET_BYTES, MAX_ASSET_BYTES),
      state: 'pending',
      expiresAt: now + INTENT_TTL_MS,
      ...(createdByUserId ? { createdByUserId } : {}),
      ...(createdByRunnerId ? { createdByRunnerId } : {}),
      createdAt: now,
    });
    return { intentId, uploadUrl, expiresAt: now + INTENT_TTL_MS };
  },
});

export const finalizeAssetUpload = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    intentId: v.id('assetUploadIntents'),
    storageId: v.id('_storage'),
    checksum: v.string(),
    byteSize: v.number(),
    width: v.number(),
    height: v.number(),
    mime: v.union(v.literal('image/png'), v.literal('image/jpeg'), v.literal('image/webp')),
    altText: v.string(),
    runnerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAssetLimits(args);
    if (!/^[a-f0-9]{64}$/u.test(args.checksum)) throw new Error('unsafe_asset');
    const intent = await ctx.db.get(args.intentId);
    if (!intent || intent.workspaceId !== args.workspaceId) throw new Error('intent_not_found');
    if (intent.state !== 'pending' || intent.expiresAt <= Date.now()) {
      throw new Error('intent_expired');
    }
    if (args.byteSize > intent.maxBytes) throw new Error('unsafe_asset');
    if (args.runnerToken) {
      const runner = await requireRunner(ctx, args.runnerToken);
      if (intent.createdByRunnerId !== runner._id) throw new Error('forbidden');
    } else {
      const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
      if (intent.createdByUserId && intent.createdByUserId !== user._id)
        throw new Error('forbidden');
    }
    const assetId = await ctx.db.insert('assets', {
      workspaceId: args.workspaceId,
      storageId: args.storageId,
      kind: intent.expectedKind,
      mime: args.mime,
      byteSize: args.byteSize,
      width: args.width,
      height: args.height,
      checksum: args.checksum,
      altText: args.altText.slice(0, 200),
      provenance: args.runnerToken ? 'runner_capture' : 'human_upload',
      status: 'ready',
      createdAt: Date.now(),
    });
    await ctx.db.patch(intent._id, { state: 'finalized', assetId, expiresAt: Date.now() });
    return { assetId };
  },
});

export const getAuthorizedAssetUrl = query({
  args: {
    workspaceId: v.id('workspaces'),
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.workspaceId !== args.workspaceId || asset.status !== 'ready') {
      throw new Error('asset_not_found');
    }
    const url = await convexAssetStore(ctx).getUrl(asset.storageId);
    if (!url) throw new Error('asset_unavailable');
    return {
      assetId: asset._id,
      url,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
    };
  },
});

export const attachCapturedAsset = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    runnerToken: v.string(),
    storageId: v.id('_storage'),
    checksum: v.string(),
    byteSize: v.number(),
    width: v.number(),
    height: v.number(),
    mime: v.union(v.literal('image/png'), v.literal('image/jpeg'), v.literal('image/webp')),
    kind: v.union(v.literal('viewport'), v.literal('full_page'), v.literal('thumbnail')),
    altText: v.string(),
    designRevisionId: v.id('designRevisions'),
    designScreenRevisionId: v.id('designScreenRevisions'),
  },
  handler: async (ctx, args) => {
    assertAssetLimits(args);
    if (!/^[a-f0-9]{64}$/u.test(args.checksum)) throw new Error('unsafe_asset');
    const runner = await requireRunner(ctx, args.runnerToken);
    if (!runner.allowedWorkspaceIds.includes(args.workspaceId)) {
      throw new Error('workspace_mismatch');
    }
    const revision = await ctx.db.get(args.designRevisionId);
    const screenRevision = await ctx.db.get(args.designScreenRevisionId);
    if (
      !revision ||
      !screenRevision ||
      revision.workspaceId !== args.workspaceId ||
      screenRevision.workspaceId !== args.workspaceId
    ) {
      throw new Error('design_revision_not_found');
    }
    const assetId = await ctx.db.insert('assets', {
      workspaceId: args.workspaceId,
      storageId: args.storageId,
      kind: args.kind,
      mime: args.mime,
      byteSize: args.byteSize,
      width: args.width,
      height: args.height,
      checksum: args.checksum,
      altText: args.altText.slice(0, 200),
      provenance: 'runner_capture',
      sourceRunnerId: runner._id,
      designRevisionId: args.designRevisionId,
      designScreenRevisionId: args.designScreenRevisionId,
      status: 'ready',
      createdAt: Date.now(),
    });
    return { assetId };
  },
});
