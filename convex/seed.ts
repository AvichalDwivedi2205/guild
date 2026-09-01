import { v } from 'convex/values';

import { mutation } from './_generated/server';
import { syncIdentity } from './lib/auth';

const JUDGE_WORKSPACE_TITLE = 'Guild Judge Workspace';

export const ensureJudgeWorkspace = mutation({
  args: {},
  returns: v.object({
    workspaceId: v.id('workspaces'),
    created: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await syncIdentity(ctx);
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_userId_and_workspaceId', (query) => query.eq('userId', userId))
      .take(50);
    for (const membership of memberships) {
      const workspace = await ctx.db.get(membership.workspaceId);
      if (workspace?.title === JUDGE_WORKSPACE_TITLE) {
        return { workspaceId: workspace._id, created: false };
      }
    }
    const now = Date.now();
    const workspaceId = await ctx.db.insert('workspaces', {
      title: JUDGE_WORKSPACE_TITLE,
      ownerId: userId,
      boardMode: 'diagram',
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId,
      role: 'owner',
      joinedAt: now,
    });
    return { workspaceId, created: true };
  },
});
