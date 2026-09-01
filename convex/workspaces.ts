import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember, syncIdentity } from './lib/auth';
import { limits } from './lib/policies';
import { boardModeValidator } from './validators';

const workspaceSummaryValidator = v.object({
  _id: v.id('workspaces'),
  title: v.string(),
  boardMode: boardModeValidator,
  role: v.union(v.literal('owner'), v.literal('editor'), v.literal('viewer')),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(workspaceSummaryValidator),
  handler: async (ctx, args) => {
    const user = await (async () => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error('unauthenticated');
      return await ctx.db
        .query('users')
        .withIndex('by_tokenIdentifier', (index) =>
          index.eq('tokenIdentifier', identity.tokenIdentifier),
        )
        .unique();
    })();
    if (!user) return [];
    const limit = Math.max(1, Math.min(args.limit ?? 50, limits.workspaceMembers));
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_userId_and_workspaceId', (index) => index.eq('userId', user._id))
      .take(limit);
    const rows = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        if (!workspace) return null;
        return {
          _id: workspace._id,
          title: workspace.title,
          boardMode: workspace.boardMode,
          role: membership.role,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        };
      }),
    );
    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    boardMode: v.optional(boardModeValidator),
  },
  returns: v.id('workspaces'),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title || title.length > 120) throw new Error('invalid_workspace_title');
    const userId = await syncIdentity(ctx);
    const now = Date.now();
    const workspaceId = await ctx.db.insert('workspaces', {
      title,
      ownerId: userId,
      boardMode: args.boardMode ?? 'diagram',
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId,
      role: 'owner',
      joinedAt: now,
    });
    return workspaceId;
  },
});

export const get = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.union(v.null(), workspaceSummaryValidator),
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMember(ctx, args.workspaceId);
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;
    return {
      _id: workspace._id,
      title: workspace.title,
      boardMode: workspace.boardMode,
      role: membership.role,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  },
});

export const update = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    title: v.optional(v.string()),
    boardMode: v.optional(boardModeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const title = args.title?.trim();
    if (args.title !== undefined && (!title || title.length > 120)) {
      throw new Error('invalid_workspace_title');
    }
    await ctx.db.patch(args.workspaceId, {
      ...(title ? { title } : {}),
      ...(args.boardMode ? { boardMode: args.boardMode } : {}),
      updatedAt: Date.now(),
    });
    return null;
  },
});
