import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery } from './_generated/server';

export const getExpiredUploadIntent = internalQuery({
  args: { intentId: v.id('assetUploadIntents') },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    if (!intent || intent.state !== 'pending' || intent.expiresAt > Date.now()) return null;
    return { storageId: intent.storageId ?? null };
  },
});

export const markUploadIntentExpired = internalMutation({
  args: { intentId: v.id('assetUploadIntents') },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    if (!intent || intent.state !== 'pending' || intent.expiresAt > Date.now()) {
      return { ok: false };
    }
    await ctx.db.patch(intent._id, { state: 'expired' });
    return { ok: true };
  },
});

export const expireUploadIntent = internalAction({
  args: { intentId: v.id('assetUploadIntents') },
  handler: async (ctx, args): Promise<{ expired: boolean }> => {
    const expired = await ctx.runQuery(internal.captureCleanup.getExpiredUploadIntent, args);
    if (!expired) return { expired: false };
    if (expired.storageId) await ctx.storage.delete(expired.storageId);
    const result = await ctx.runMutation(internal.captureCleanup.markUploadIntentExpired, args);
    return { expired: result.ok };
  },
});
