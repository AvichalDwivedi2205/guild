import { visualFeedbackReferenceSchema } from '@guild/protocol';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import {
  appendActivity,
  appendChange,
  resolveCommandPrincipal,
  type CommandPrincipal,
} from './lib/commands';
import { hashWorkspaceRequest, recordWorkspaceMutation } from './lib/recorder';
import { createTeamRun } from './lib/runLifecycle';

export const createVisualComment = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    source: v.union(v.literal('ui'), v.literal('webmcp')),
    idempotencyKey: v.string(),
    body: v.string(),
    targetObjectId: v.id('canvasObjects'),
    reference: v.any(),
    cropAssetId: v.optional(v.id('assets')),
  },
  handler: async (ctx, args) => {
    const reference = visualFeedbackReferenceSchema.parse(args.reference);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, args.source);
    if (principal.kind === 'worker') throw new Error('forbidden');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'visualFeedback.createVisualComment',
      workspaceId: args.workspaceId,
      body: args.body,
      targetObjectId: args.targetObjectId,
      reference,
      cropAssetId: args.cropAssetId ?? null,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'visualFeedback.createVisualComment',
      idempotencyKey: args.idempotencyKey,
      requestHash,
      summary: 'Added visual comment',
      apply: async ({ changeSetId }) =>
        applyVisualComment(ctx, { ...args, principal, changeSetId, reference }),
    });
    if (recorded.replay) {
      const anchorChange = recorded.changed[0];
      if (!anchorChange) throw new Error('idempotency_replay_incomplete');
      const anchor = await ctx.db.get(anchorChange.targetId as Id<'visualAnchors'>);
      if (!anchor || anchor.workspaceId !== args.workspaceId) {
        throw new Error('idempotency_replay_incomplete');
      }
      const comment = await ctx.db.get(anchor.commentId);
      if (!comment || comment.workspaceId !== args.workspaceId) {
        throw new Error('idempotency_replay_incomplete');
      }
      const feedback = await ctx.db
        .query('externalWorkstreamFeedback')
        .withIndex('by_sourceCommentId', (query) => query.eq('sourceCommentId', comment._id))
        .unique();
      return {
        commentId: comment._id,
        anchorId: anchor._id,
        changeSetId: recorded.changeSetId,
        jobId: comment.jobIds[0] ?? null,
        feedbackId: feedback?._id ?? null,
        idempotentReplay: true,
      };
    }
    return recorded.result;
  },
});

async function applyVisualComment(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    body: string;
    targetObjectId: Id<'canvasObjects'>;
    cropAssetId?: Id<'assets'>;
    principal: CommandPrincipal;
    changeSetId: Id<'changeSets'>;
    reference: ReturnType<typeof visualFeedbackReferenceSchema.parse>;
  },
) {
  const object = await ctx.db.get(input.targetObjectId);
  if (!object || object.workspaceId !== input.workspaceId || object.isDeleted) {
    throw new Error('object_not_found');
  }
  const screenRevision = await ctx.db.get(
    input.reference.screenRevisionId as Id<'designScreenRevisions'>,
  );
  if (!screenRevision || screenRevision.workspaceId !== input.workspaceId) {
    throw new Error('design_revision_not_found');
  }
  const now = Date.now();
  const commentId = await ctx.db.insert('comments', {
    workspaceId: input.workspaceId,
    targetType: 'object',
    objectId: input.targetObjectId,
    authorKind: input.principal.kind,
    authorUserId: input.principal.userId,
    body: input.body.trim(),
    mentionedRoleProfileIds: [],
    state: 'open',
    revision: 0,
    jobIds: [],
    createdAt: now,
    updatedAt: now,
  });
  const anchorId = await ctx.db.insert('visualAnchors', {
    workspaceId: input.workspaceId,
    commentId,
    designScreenRevisionId: screenRevision._id,
    kind: input.reference.kind,
    viewportKey: input.reference.viewportKey,
    viewportWidth: input.reference.viewportWidth,
    viewportHeight: input.reference.viewportHeight,
    scrollX: input.reference.scrollX,
    scrollY: input.reference.scrollY,
    ...(input.reference.point
      ? { pointX: input.reference.point.x, pointY: input.reference.point.y }
      : {}),
    ...(input.reference.rectangle
      ? {
          rectX: input.reference.rectangle.x,
          rectY: input.reference.rectangle.y,
          rectWidth: input.reference.rectangle.width,
          rectHeight: input.reference.rectangle.height,
        }
      : {}),
    ...(input.cropAssetId ? { cropAssetId: input.cropAssetId } : {}),
    ...(input.reference.stableElementId
      ? { stableElementId: input.reference.stableElementId }
      : {}),
    detached: false,
    createdAt: now,
  });
  await ctx.db.patch(commentId, { visualAnchorId: anchorId, threadRootId: commentId });

  const ownerRoleProfileId = object.semantics.ownerRoleProfileId;
  let jobId: Id<'jobs'> | undefined;
  let feedbackId: Id<'externalWorkstreamFeedback'> | undefined;
  if (ownerRoleProfileId) {
    const role = await ctx.db.get(ownerRoleProfileId);
    if (role && (role.engine === 'codex' || role.engine === 'claude')) {
      const started = await createTeamRun(ctx, {
        workspaceId: input.workspaceId,
        roleProfileIds: [ownerRoleProfileId],
        brief: input.body.trim(),
        trigger: 'comment_owner',
        triggerKey: `visual:${commentId}`,
        createdByUserId: input.principal.userId,
        source: input.principal.source === 'webmcp' ? 'webmcp' : 'ui',
        targetObjectId: input.targetObjectId,
      });
      jobId = started.jobIds[0];
      await ctx.db.patch(commentId, {
        state: 'queued',
        teamRunId: started.runId,
        jobIds: started.jobIds,
        updatedAt: now,
      });
    }
  }
  if (!jobId) {
    const streams = await ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_state', (query) =>
        query.eq('workspaceId', input.workspaceId).eq('state', 'reported'),
      )
      .take(20);
    const targetDistance = new Map<string, number>([[object._id, 0]]);
    let parentId = object.parentId;
    for (let distance = 1; parentId && distance <= 8; distance += 1) {
      const parent = await ctx.db.get(parentId);
      if (!parent || parent.workspaceId !== input.workspaceId || parent.isDeleted) break;
      targetDistance.set(parent._id, distance);
      parentId = parent.parentId;
    }
    const candidates = streams
      .filter((stream) => stream.targetObjectId && targetDistance.has(stream.targetObjectId))
      .map((stream) => ({ stream, distance: targetDistance.get(stream.targetObjectId!)! }))
      .sort((left, right) => left.distance - right.distance);
    const bestDistance = candidates[0]?.distance;
    const best = candidates.filter((candidate) => candidate.distance === bestDistance);
    if (best.length > 1) throw new Error('ambiguous_delivery_target');
    const stream = best[0]?.stream;
    if (stream) {
      feedbackId = await ctx.db.insert('externalWorkstreamFeedback', {
        workspaceId: input.workspaceId,
        workstreamId: stream._id,
        sourceCommentId: commentId,
        visualAnchorId: anchorId,
        state: 'pending',
        body: input.body.trim(),
        ...(input.cropAssetId ? { cropAssetId: input.cropAssetId } : {}),
        createdAt: now,
      });
    }
  }
  if (jobId && feedbackId) throw new Error('duplicate_delivery');

  await appendChange(ctx, {
    workspaceId: input.workspaceId,
    changeSetId: input.changeSetId,
    targetKind: 'visualAnchor',
    targetId: anchorId,
    segment: 'lifecycle',
    beforeValue: null,
    afterValue: { commentId, anchorId, jobId: jobId ?? null, feedbackId: feedbackId ?? null },
    postRevision: 0,
    sequence: 0,
  });
  await appendChange(ctx, {
    workspaceId: input.workspaceId,
    changeSetId: input.changeSetId,
    targetKind: 'comment',
    targetId: commentId,
    segment: 'lifecycle',
    beforeValue: null,
    afterValue: { body: input.body.trim() },
    postRevision: 0,
    sequence: 1,
  });
  await appendActivity(ctx, {
    workspaceId: input.workspaceId,
    principal: input.principal,
    eventType: 'visual_comment_created',
    summary: 'Added visual comment',
    targetId: commentId,
    changeSetId: input.changeSetId,
  });
  return {
    commentId,
    anchorId,
    changeSetId: input.changeSetId,
    jobId: jobId ?? null,
    feedbackId: feedbackId ?? null,
    idempotentReplay: false,
  };
}

export const listVisualAnchors = query({
  args: {
    workspaceId: v.id('workspaces'),
    designScreenRevisionId: v.id('designScreenRevisions'),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const anchors = await ctx.db
      .query('visualAnchors')
      .withIndex('by_designScreenRevisionId', (query) =>
        query.eq('designScreenRevisionId', args.designScreenRevisionId),
      )
      .take(50);
    return anchors.filter((anchor) => anchor.workspaceId === args.workspaceId);
  },
});

export const getAssignmentFeedback = query({
  args: {
    workspaceId: v.id('workspaces'),
    jobId: v.id('jobs'),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const job = await ctx.db.get(args.jobId);
    if (!job || job.workspaceId !== args.workspaceId) throw new Error('job_not_found');
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_workspaceId_and_state', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('state', 'queued'),
      )
      .take(50);
    const matched = comments.find((comment) => comment.jobIds.includes(args.jobId));
    if (!matched) return { comment: null, image: null };
    const anchor = matched.visualAnchorId ? await ctx.db.get(matched.visualAnchorId) : null;
    return {
      comment: {
        id: matched._id,
        body: matched.body.slice(0, 2_000),
        revisionRoute: anchor ? undefined : undefined,
      },
      image: anchor?.cropAssetId ? { assetId: anchor.cropAssetId } : null,
      anchor: anchor
        ? {
            kind: anchor.kind,
            viewportKey: anchor.viewportKey,
            screenRevisionId: anchor.designScreenRevisionId,
          }
        : null,
    };
  },
});
