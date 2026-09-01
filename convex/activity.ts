import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { limits } from './lib/policies';

export const list = query({
  args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db
      .query('activityEvents')
      .withIndex('by_workspaceId_and_createdAt', (index) =>
        index.eq('workspaceId', args.workspaceId),
      )
      .order('desc')
      .take(Math.max(1, Math.min(args.limit ?? 100, limits.activityEvents)));
  },
});

export const recordWebMcp = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    toolName: v.string(),
    outcome: v.union(v.literal('ok'), v.literal('error')),
    durationMs: v.number(),
    changeSetId: v.optional(v.id('changeSets')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId);
    const toolName = args.toolName.trim().slice(0, 80);
    if (!toolName) throw new Error('invalid_webmcp_tool');
    await ctx.db.insert('activityEvents', {
      workspaceId: args.workspaceId,
      actorKind: 'webmcp',
      actorUserId: user._id,
      source: 'webmcp',
      eventType: 'webmcp_invocation',
      summary: `${toolName} ${args.outcome} in ${Math.max(0, Math.round(args.durationMs))}ms`,
      ...(args.changeSetId ? { changeSetId: args.changeSetId } : {}),
      createdAt: Date.now(),
    });
    return null;
  },
});
