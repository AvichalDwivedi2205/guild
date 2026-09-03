import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { routeComment } from '../src/domain/comments';
import { requireWorkspaceMember } from './lib/auth';
import { createTeamRun } from './lib/runLifecycle';
import { requireWorkerAuthorization } from './lib/runnerAuth';
import { routeCommentToExternalWorkstream } from './lib/externalFeedback';
import { commentStateValidator, workerAuthorizationValidator } from './validators';

const targetArgs = {
  targetType: v.union(v.literal('workspace'), v.literal('object'), v.literal('edge')),
  objectId: v.optional(v.id('canvasObjects')),
  edgeId: v.optional(v.id('canvasEdges')),
};

async function validateTarget(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    targetType: 'workspace' | 'object' | 'edge';
    objectId?: Id<'canvasObjects'>;
    edgeId?: Id<'canvasEdges'>;
  },
) {
  if (input.targetType === 'workspace') {
    if (input.objectId || input.edgeId) throw new Error('invalid_comment_target');
    return { ownerRoleProfileId: undefined };
  }
  if (input.targetType === 'object') {
    if (!input.objectId || input.edgeId) throw new Error('invalid_comment_target');
    const object = await ctx.db.get(input.objectId);
    if (!object || object.workspaceId !== input.workspaceId || object.isDeleted) {
      throw new Error('object_not_found');
    }
    return { ownerRoleProfileId: object.semantics.ownerRoleProfileId };
  }
  if (!input.edgeId || input.objectId) throw new Error('invalid_comment_target');
  const edge = await ctx.db.get(input.edgeId);
  if (!edge || edge.workspaceId !== input.workspaceId || edge.isDeleted) {
    throw new Error('edge_not_found');
  }
  return { ownerRoleProfileId: undefined };
}

async function routeHumanComment(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    commentId: Id<'comments'>;
    revision: number;
    body: string;
    ownerRoleProfileId?: Id<'roleProfiles'>;
    targetObjectId?: Id<'canvasObjects'>;
    userId: Id<'users'>;
    source: 'ui' | 'webmcp';
  },
) {
  const roles = await ctx.db
    .query('roleProfiles')
    .withIndex('by_workspaceId', (query) => query.eq('workspaceId', input.workspaceId))
    .take(25);
  const route = routeComment({
    commentId: input.commentId,
    revision: input.revision,
    body: input.body,
    authorKind: 'human',
    targetOwnerRoleProfileId: input.ownerRoleProfileId ?? null,
    roleProfiles: roles.map((role) => ({ id: role._id, handle: role.handle })),
  });
  if (route.kind === 'none') {
    await ctx.db.patch(input.commentId, {
      mentionedRoleProfileIds: [],
      state: route.commentState,
      updatedAt: Date.now(),
    });
    return { jobIds: [] as Id<'jobs'>[], state: route.commentState };
  }
  const started = await createTeamRun(ctx, {
    workspaceId: input.workspaceId,
    roleProfileIds: route.roleProfileIds as Id<'roleProfiles'>[],
    brief: input.body,
    trigger:
      route.kind === 'team'
        ? 'comment_team'
        : route.kind === 'owner'
          ? 'comment_owner'
          : 'comment_role',
    triggerKey: route.triggerKey,
    createdByUserId: input.userId,
    source: input.source,
    ...(input.targetObjectId && route.kind !== 'team'
      ? { targetObjectId: input.targetObjectId }
      : {}),
  });
  await ctx.db.patch(input.commentId, {
    mentionedRoleProfileIds: route.roleProfileIds as Id<'roleProfiles'>[],
    state: 'queued',
    triggerKey: route.triggerKey,
    teamRunId: started.runId,
    jobIds: started.jobIds,
    updatedAt: Date.now(),
  });
  return { jobIds: started.jobIds, teamRunId: started.runId, state: 'queued' as const };
}

export const list = query({
  args: { workspaceId: v.id('workspaces'), state: v.optional(commentStateValidator) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    if (args.state) {
      return await ctx.db
        .query('comments')
        .withIndex('by_workspaceId_and_state', (query) =>
          query.eq('workspaceId', args.workspaceId).eq('state', args.state!),
        )
        .take(200);
    }
    return await ctx.db
      .query('comments')
      .withIndex('by_workspaceId_and_targetType', (query) =>
        query.eq('workspaceId', args.workspaceId),
      )
      .take(200);
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    ...targetArgs,
    body: v.string(),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
    idempotencyKey: v.string(),
  },
  returns: v.object({
    commentId: v.id('comments'),
    teamRunId: v.optional(v.id('teamRuns')),
    jobIds: v.array(v.id('jobs')),
    state: commentStateValidator,
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const existingChange = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId_and_idempotencyKey', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    if (existingChange) {
      const entry = await ctx.db
        .query('changeEntries')
        .withIndex('by_changeSetId_and_sequence', (query) =>
          query.eq('changeSetId', existingChange._id),
        )
        .first();
      if (!entry) throw new Error('idempotency_record_incomplete');
      const comment = await ctx.db.get(entry.targetId as Id<'comments'>);
      if (!comment) throw new Error('comment_not_found');
      if (comment.objectId && comment.state === 'unassigned') {
        await routeCommentToExternalWorkstream(ctx, {
          workspaceId: args.workspaceId,
          commentId: comment._id,
          targetObjectId: comment.objectId,
          body: comment.body,
        });
      }
      const currentComment = await ctx.db.get(comment._id);
      if (!currentComment) throw new Error('comment_not_found');
      return {
        commentId: currentComment._id,
        ...(currentComment.teamRunId ? { teamRunId: currentComment.teamRunId } : {}),
        jobIds: currentComment.jobIds,
        state: currentComment.state,
      };
    }
    const body = args.body.trim();
    if (!body || body.length > 10_000) throw new Error('invalid_comment_body');
    const target = await validateTarget(ctx, args);
    const now = Date.now();
    const source = args.source ?? 'ui';
    const commentId = await ctx.db.insert('comments', {
      workspaceId: args.workspaceId,
      targetType: args.targetType,
      ...(args.objectId ? { objectId: args.objectId } : {}),
      ...(args.edgeId ? { edgeId: args.edgeId } : {}),
      authorKind: source === 'webmcp' ? 'webmcp' : 'human',
      authorUserId: user._id,
      body,
      mentionedRoleProfileIds: [],
      state: 'open',
      revision: 0,
      jobIds: [],
      createdAt: now,
      updatedAt: now,
    });
    const changeSetId = await ctx.db.insert('changeSets', {
      workspaceId: args.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      idempotencyKey: args.idempotencyKey,
      summary: 'Added comment',
      state: 'applied',
      createdAt: now,
    });
    await ctx.db.insert('changeEntries', {
      workspaceId: args.workspaceId,
      changeSetId,
      targetKind: 'comment',
      targetId: commentId,
      segment: 'lifecycle',
      beforeValue: null,
      afterValue: { body },
      postRevision: 0,
      sequence: 0,
      createdAt: now,
    });
    const routed = await routeHumanComment(ctx, {
      workspaceId: args.workspaceId,
      commentId,
      revision: 0,
      body,
      ...(target.ownerRoleProfileId ? { ownerRoleProfileId: target.ownerRoleProfileId } : {}),
      ...(args.objectId ? { targetObjectId: args.objectId } : {}),
      userId: user._id,
      source,
    });
    const externalFeedbackId =
      !routed.teamRunId && args.objectId
        ? await routeCommentToExternalWorkstream(ctx, {
            workspaceId: args.workspaceId,
            commentId,
            targetObjectId: args.objectId,
            body,
          })
        : undefined;
    const effectiveState = externalFeedbackId ? ('queued' as const) : routed.state;
    await ctx.db.insert('activityEvents', {
      workspaceId: args.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      eventType: routed.teamRunId || externalFeedbackId ? 'comment_routed' : 'comment_added',
      summary:
        routed.teamRunId || externalFeedbackId ? 'Added and routed comment' : 'Added comment',
      targetId: commentId,
      changeSetId,
      ...(routed.teamRunId ? { teamRunId: routed.teamRunId } : {}),
      createdAt: now,
    });
    return { commentId, ...routed, state: effectiveState };
  },
});

export const resolve = mutation({
  args: { commentId: v.id('comments') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error('comment_not_found');
    await requireWorkspaceMember(ctx, comment.workspaceId, 'editor');
    if (comment.state === 'resolved') return null;
    await ctx.db.patch(comment._id, {
      state: 'resolved',
      revision: comment.revision + 1,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const addWorker = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    objectId: v.optional(v.id('canvasObjects')),
    body: v.string(),
    idempotencyKey: v.string(),
    workerAuthorization: workerAuthorizationValidator,
  },
  returns: v.id('comments'),
  handler: async (ctx, args) => {
    const worker = await requireWorkerAuthorization(ctx, args.workerAuthorization);
    if (worker.job.workspaceId !== args.workspaceId) throw new Error('workspace_mismatch');
    if (/@[a-z0-9_-]+/i.test(args.body)) throw new Error('worker_mentions_not_allowed');
    const body = args.body.trim();
    if (!body || body.length > 10_000) throw new Error('invalid_comment_body');
    const triggerKey = `worker-comment:${worker.job._id}:${worker.job.attempt}:${args.idempotencyKey}`;
    const existing = await ctx.db
      .query('comments')
      .withIndex('by_workspaceId_and_triggerKey', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('triggerKey', triggerKey),
      )
      .unique();
    if (existing) return existing._id;
    const objectId = args.objectId ?? worker.claim.targetObjectId;
    const object = await ctx.db.get(objectId);
    if (!object || object.workspaceId !== args.workspaceId || object.isDeleted) {
      throw new Error('object_not_found');
    }
    const now = Date.now();
    return await ctx.db.insert('comments', {
      workspaceId: args.workspaceId,
      targetType: 'object',
      objectId,
      authorKind: 'worker',
      authorUserId: worker.runner.ownerUserId,
      authorRoleProfileId: worker.job.roleProfileId,
      body,
      mentionedRoleProfileIds: [],
      state: 'open',
      revision: 0,
      triggerKey,
      teamRunId: worker.job.teamRunId,
      jobIds: [worker.job._id],
      createdAt: now,
      updatedAt: now,
    });
  },
});
