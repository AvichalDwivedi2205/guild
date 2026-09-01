import { v } from 'convex/values';

import { query } from './_generated/server';
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
