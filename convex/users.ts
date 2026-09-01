import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireCurrentUser, syncIdentity } from './lib/auth';

export const syncCurrent = mutation({
  args: {},
  returns: v.id('users'),
  handler: async (ctx) => await syncIdentity(ctx),
});

export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      tokenIdentifier: v.string(),
      workosUserId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    try {
      return await requireCurrentUser(ctx);
    } catch (error) {
      if (error instanceof Error && error.message === 'user_not_initialized') return null;
      throw error;
    }
  },
});
