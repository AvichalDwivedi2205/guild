import { v } from 'convex/values';

import { internalMutation, internalQuery } from './_generated/server';
import { createContentPreview } from './lib/content';
import { limits } from './lib/policies';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

function previewsMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export const backfillCanvasContentPreviews = internalMutation({
  args: { workspaceId: v.id('workspaces') },
  returns: v.object({ scanned: v.number(), updated: v.number(), atLimit: v.boolean() }),
  handler: async (ctx, { workspaceId }) => {
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', workspaceId).eq('isDeleted', false),
      )
      .take(limits.canvasObjects);
    let updated = 0;
    for (const object of objects) {
      const body = await ctx.db
        .query('canvasObjectBodies')
        .withIndex('by_workspaceId_and_objectId', (index) =>
          index.eq('workspaceId', workspaceId).eq('objectId', object._id),
        )
        .unique();
      const contentPreview = createContentPreview(body?.body);
      if (!previewsMatch(object.contentPreview, contentPreview)) {
        await ctx.db.patch(object._id, { contentPreview });
        updated += 1;
      }
    }
    return { scanned: objects.length, updated, atLimit: objects.length === limits.canvasObjects };
  },
});

export const verifyCanvasContentPreviews = internalQuery({
  args: { workspaceId: v.id('workspaces') },
  returns: v.object({ scanned: v.number(), mismatches: v.number(), atLimit: v.boolean() }),
  handler: async (ctx, { workspaceId }) => {
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', workspaceId).eq('isDeleted', false),
      )
      .take(limits.canvasObjects);
    let mismatches = 0;
    for (const object of objects) {
      const body = await ctx.db
        .query('canvasObjectBodies')
        .withIndex('by_workspaceId_and_objectId', (index) =>
          index.eq('workspaceId', workspaceId).eq('objectId', object._id),
        )
        .unique();
      if (!previewsMatch(object.contentPreview, createContentPreview(body?.body))) mismatches += 1;
    }
    return {
      scanned: objects.length,
      mismatches,
      atLimit: objects.length === limits.canvasObjects,
    };
  },
});
