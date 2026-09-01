import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';

const signalArgs = {
  cursor: v.optional(v.union(v.null(), v.object({ x: v.number(), y: v.number() }))),
  viewport: v.optional(
    v.union(
      v.null(),
      v.object({
        x: v.number(),
        y: v.number(),
        zoom: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
  ),
  selectedObjectIds: v.array(v.id('canvasObjects')),
  editingObjectId: v.optional(v.union(v.null(), v.id('canvasObjects'))),
};

const signalValidator = v.object({
  _id: v.id('liveSignals'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  userId: v.id('users'),
  sessionId: v.string(),
  cursor: signalArgs.cursor,
  viewport: signalArgs.viewport,
  selectedObjectIds: signalArgs.selectedObjectIds,
  editingObjectId: signalArgs.editingObjectId,
  lastSeenAt: v.number(),
  expiresAt: v.number(),
  user: v.union(v.null(), v.object({ name: v.string() })),
});

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(signalValidator),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const now = Date.now();
    const signals = await ctx.db
      .query('liveSignals')
      .withIndex('by_workspaceId_and_expiresAt', (index) =>
        index.eq('workspaceId', args.workspaceId).gt('expiresAt', now),
      )
      .take(100);
    return await Promise.all(
      signals.map(async (signal) => {
        const user = await ctx.db.get(signal.userId);
        return { ...signal, user: user ? { name: user.name } : null };
      }),
    );
  },
});

export const heartbeat = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    sessionId: v.string(),
    ...signalArgs,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId);
    const sessionId = args.sessionId.trim();
    if (!sessionId || sessionId.length > 160) throw new Error('invalid_presence_session');
    if (args.selectedObjectIds.length > 100) throw new Error('too_many_selected_objects');
    for (const objectId of [
      ...args.selectedObjectIds,
      ...(args.editingObjectId ? [args.editingObjectId] : []),
    ]) {
      const object = await ctx.db.get(objectId);
      if (!object || object.workspaceId !== args.workspaceId || object.isDeleted) {
        throw new Error('object_not_found');
      }
    }
    const existing = await ctx.db
      .query('liveSignals')
      .withIndex('by_workspaceId_and_sessionId', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('sessionId', sessionId),
      )
      .unique();
    if (existing && existing.userId !== user._id) throw new Error('presence_session_conflict');
    const now = Date.now();
    const values = {
      ...(args.cursor !== undefined ? { cursor: args.cursor } : {}),
      ...(args.viewport !== undefined ? { viewport: args.viewport } : {}),
      selectedObjectIds: [...new Set(args.selectedObjectIds)],
      ...(args.editingObjectId !== undefined ? { editingObjectId: args.editingObjectId } : {}),
      lastSeenAt: now,
      expiresAt: now + 30_000,
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else {
      await ctx.db.insert('liveSignals', {
        workspaceId: args.workspaceId,
        userId: user._id,
        sessionId,
        ...values,
      });
    }
    return null;
  },
});

export const leave = mutation({
  args: { workspaceId: v.id('workspaces'), sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId);
    const signal = await ctx.db
      .query('liveSignals')
      .withIndex('by_workspaceId_and_sessionId', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('sessionId', args.sessionId),
      )
      .unique();
    if (signal && signal.userId === user._id) await ctx.db.delete(signal._id);
    return null;
  },
});
