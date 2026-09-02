import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { createContentPreview } from './lib/content';

export const listImplementation = query({
  args: { workspaceId: v.id('workspaces'), status: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('isDeleted', false),
      )
      .take(600);
    return objects.filter(
      (object) =>
        object.type === 'task' &&
        object.semantics.projectArea === 'implementation' &&
        (!args.status || object.semantics.status === args.status),
    );
  },
});

export const claim = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    taskId: v.id('canvasObjects'),
    expectedSemanticsRevision: v.number(),
    idempotencyKey: v.string(),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    changeSetId: v.id('changeSets'),
    revision: v.number(),
    idempotentReplay: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const existing = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId_and_idempotencyKey', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    if (existing) {
      const task = await ctx.db.get(args.taskId);
      if (!task) throw new Error('task_not_found');
      return {
        changeSetId: existing._id,
        revision: task.semanticsRevision,
        idempotentReplay: true,
      };
    }
    const task = await ctx.db.get(args.taskId);
    if (
      !task ||
      task.workspaceId !== args.workspaceId ||
      task.isDeleted ||
      task.type !== 'task' ||
      task.semantics.projectArea !== 'implementation'
    ) {
      throw new Error('task_not_found');
    }
    if (task.semanticsRevision !== args.expectedSemanticsRevision) {
      throw new Error('revision_conflict');
    }
    if (task.semantics.ownerUserId && task.semantics.ownerUserId !== user._id) {
      throw new Error('task_already_claimed');
    }
    const before = task.semantics;
    const after = { ...before, ownerUserId: user._id, status: 'in_progress' };
    const revision = task.semanticsRevision + 1;
    const now = Date.now();
    await ctx.db.patch(task._id, { semantics: after, semanticsRevision: revision, updatedAt: now });
    const source = args.source ?? 'ui';
    const changeSetId = await ctx.db.insert('changeSets', {
      workspaceId: args.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      idempotencyKey: args.idempotencyKey,
      summary: `Claimed implementation task${task.title ? `: ${task.title}` : ''}`,
      state: 'applied',
      createdAt: now,
    });
    await ctx.db.insert('changeEntries', {
      workspaceId: args.workspaceId,
      changeSetId,
      targetKind: 'object',
      targetId: task._id,
      segment: 'semantics',
      beforeValue: before,
      afterValue: after,
      postRevision: revision,
      sequence: 0,
      createdAt: now,
    });
    return { changeSetId, revision, idempotentReplay: false };
  },
});

export const reportResult = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    taskId: v.id('canvasObjects'),
    expectedSemanticsRevision: v.number(),
    status: v.union(v.literal('completed'), v.literal('failed'), v.literal('blocked')),
    result: v.string(),
    idempotencyKey: v.string(),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    changeSetId: v.id('changeSets'),
    revision: v.number(),
    idempotentReplay: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const existing = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId_and_idempotencyKey', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    const task = await ctx.db.get(args.taskId);
    if (!task || task.workspaceId !== args.workspaceId || task.isDeleted || task.type !== 'task') {
      throw new Error('task_not_found');
    }
    if (existing) {
      return {
        changeSetId: existing._id,
        revision: task.semanticsRevision,
        idempotentReplay: true,
      };
    }
    if (task.semanticsRevision !== args.expectedSemanticsRevision)
      throw new Error('revision_conflict');
    if (task.semantics.ownerUserId && task.semantics.ownerUserId !== user._id) {
      throw new Error('task_claimed_by_other_user');
    }
    const result = args.result.trim();
    if (!result || result.length > 30_000) throw new Error('invalid_task_result');
    const now = Date.now();
    const semantics = { ...task.semantics, status: args.status };
    const revision = task.semanticsRevision + 1;
    await ctx.db.patch(task._id, { semantics, semanticsRevision: revision, updatedAt: now });
    const body = await ctx.db
      .query('canvasObjectBodies')
      .withIndex('by_workspaceId_and_objectId', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('objectId', task._id),
      )
      .unique();
    const nextBody = { ...(typeof body?.body === 'object' && body.body ? body.body : {}), result };
    await ctx.db.patch(task._id, {
      contentPreview: createContentPreview(nextBody),
      updatedAt: now,
    });
    if (body)
      await ctx.db.patch(body._id, { body: nextBody, revision: body.revision + 1, updatedAt: now });
    else
      await ctx.db.insert('canvasObjectBodies', {
        workspaceId: args.workspaceId,
        objectId: task._id,
        body: nextBody,
        revision: 0,
        updatedAt: now,
      });
    const source = args.source ?? 'ui';
    const changeSetId = await ctx.db.insert('changeSets', {
      workspaceId: args.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      idempotencyKey: args.idempotencyKey,
      summary: `Reported implementation task ${args.status}`,
      state: 'applied',
      createdAt: now,
    });
    await ctx.db.insert('changeEntries', {
      workspaceId: args.workspaceId,
      changeSetId,
      targetKind: 'object',
      targetId: task._id,
      segment: 'semantics',
      beforeValue: task.semantics,
      afterValue: semantics,
      postRevision: revision,
      sequence: 0,
      createdAt: now,
    });
    return { changeSetId, revision, idempotentReplay: false };
  },
});
