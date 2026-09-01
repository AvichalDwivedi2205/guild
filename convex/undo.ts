import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { parseContentSnapshot } from './lib/content';

type Segment = Doc<'changeEntries'>['segment'];

function objectRevision(object: Doc<'canvasObjects'>, segment: Segment): number {
  if (segment === 'geometry') return object.geometryRevision;
  if (segment === 'content') return object.contentRevision;
  if (segment === 'style') return object.styleRevision;
  if (segment === 'semantics') return object.semanticsRevision;
  return object.hierarchyRevision;
}

export const list = query({
  args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const changeSets = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId', (index) => index.eq('workspaceId', args.workspaceId))
      .order('desc')
      .take(Math.max(1, Math.min(args.limit ?? 40, 80)));
    return changeSets.map((changeSet) => ({
      _id: changeSet._id,
      summary: changeSet.summary,
      source: changeSet.source,
      actorKind: changeSet.actorKind,
      state: changeSet.state,
      createdAt: changeSet.createdAt,
      canRestore: changeSet.state === 'applied',
    }));
  },
});

export const latest = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const changeSets = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId', (index) => index.eq('workspaceId', args.workspaceId))
      .order('desc')
      .take(25);
    for (const changeSet of changeSets) {
      if (
        changeSet.state !== 'applied' ||
        !(['ui', 'webmcp', 'worker'] as const).includes(
          changeSet.source as 'ui' | 'webmcp' | 'worker',
        )
      ) {
        continue;
      }
      const entries = await ctx.db
        .query('changeEntries')
        .withIndex('by_changeSetId_and_sequence', (index) => index.eq('changeSetId', changeSet._id))
        .collect();
      if (
        entries.length > 0 &&
        entries.every((entry) => ['object', 'body', 'edge'].includes(entry.targetKind))
      ) {
        return changeSet;
      }
    }
    return null;
  },
});

export const changeSet = mutation({
  args: {
    changeSetId: v.id('changeSets'),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    undoChangeSetId: v.id('changeSets'),
    reverted: v.number(),
    skippedConflicts: v.number(),
    idempotentReplay: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.changeSetId);
    if (!original) throw new Error('change_set_not_found');
    const { user } = await requireWorkspaceMember(ctx, original.workspaceId, 'editor');
    const idempotencyKey = `undo:${original._id}`;
    const priorUndo = await ctx.db
      .query('changeSets')
      .withIndex('by_workspaceId_and_idempotencyKey', (index) =>
        index.eq('workspaceId', original.workspaceId).eq('idempotencyKey', idempotencyKey),
      )
      .unique();
    if (priorUndo) {
      const priorEntries = await ctx.db
        .query('changeEntries')
        .withIndex('by_changeSetId_and_sequence', (index) => index.eq('changeSetId', priorUndo._id))
        .collect();
      return {
        undoChangeSetId: priorUndo._id,
        reverted: priorEntries.length,
        skippedConflicts: original.state === 'partially_undone' ? 1 : 0,
        idempotentReplay: true,
      };
    }
    if (original.state !== 'applied' || original.source === 'undo') {
      throw new Error('change_set_not_undoable');
    }
    const entries = await ctx.db
      .query('changeEntries')
      .withIndex('by_changeSetId_and_sequence', (index) => index.eq('changeSetId', original._id))
      .order('desc')
      .collect();
    const now = Date.now();
    const source = args.source ?? 'ui';
    const undoChangeSetId = await ctx.db.insert('changeSets', {
      workspaceId: original.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      ...(original.teamRunId ? { teamRunId: original.teamRunId } : {}),
      ...(original.jobId ? { jobId: original.jobId } : {}),
      source: 'undo',
      idempotencyKey,
      summary: `Undo: ${original.summary}`,
      state: 'applied',
      undoesChangeSetId: original._id,
      createdAt: now,
    });
    let reverted = 0;
    let skippedConflicts = 0;
    for (const entry of entries) {
      if (entry.targetKind === 'object' || entry.targetKind === 'body') {
        const object = await ctx.db.get(entry.targetId as Id<'canvasObjects'>);
        if (!object || objectRevision(object, entry.segment) !== entry.postRevision) {
          skippedConflicts += 1;
          continue;
        }
        const revision = entry.postRevision + 1;
        if (entry.segment === 'lifecycle') {
          const before = entry.beforeValue as { isDeleted?: boolean } | null;
          await ctx.db.patch(object._id, {
            isDeleted: before?.isDeleted ?? true,
            hierarchyRevision: revision,
            updatedAt: now,
          });
        } else if (entry.segment === 'geometry') {
          const before = entry.beforeValue as {
            x: number;
            y: number;
            width: number;
            height: number;
          };
          await ctx.db.patch(object._id, {
            ...before,
            geometryRevision: revision,
            updatedAt: now,
          });
        } else if (entry.segment === 'content') {
          const snapshot = parseContentSnapshot(entry.beforeValue);
          const previousBody = snapshot?.body ?? entry.beforeValue;
          const body = await ctx.db
            .query('canvasObjectBodies')
            .withIndex('by_workspaceId_and_objectId', (index) =>
              index.eq('workspaceId', original.workspaceId).eq('objectId', object._id),
            )
            .unique();
          if (body) {
            await ctx.db.patch(body._id, {
              body: previousBody,
              revision,
              updatedAt: now,
            });
          } else if (snapshot) {
            await ctx.db.insert('canvasObjectBodies', {
              workspaceId: original.workspaceId,
              objectId: object._id,
              body: previousBody,
              revision,
              updatedAt: now,
            });
          }
          await ctx.db.patch(object._id, {
            ...(snapshot ? { title: snapshot.title } : {}),
            contentRevision: revision,
            updatedAt: now,
          });
        } else if (entry.segment === 'style') {
          await ctx.db.patch(object._id, {
            style: entry.beforeValue,
            styleRevision: revision,
            updatedAt: now,
          });
        } else if (entry.segment === 'semantics') {
          await ctx.db.patch(object._id, {
            semantics: entry.beforeValue as Doc<'canvasObjects'>['semantics'],
            semanticsRevision: revision,
            updatedAt: now,
          });
        } else {
          const before = entry.beforeValue as Partial<Doc<'canvasObjects'>>;
          await ctx.db.patch(object._id, {
            ...(Object.prototype.hasOwnProperty.call(before, 'parentId')
              ? { parentId: before.parentId }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(before, 'orderKey')
              ? { orderKey: before.orderKey }
              : {}),
            ...(before.locked !== undefined ? { locked: before.locked } : {}),
            hierarchyRevision: revision,
            updatedAt: now,
          });
        }
        await ctx.db.insert('changeEntries', {
          workspaceId: original.workspaceId,
          changeSetId: undoChangeSetId,
          targetKind: entry.targetKind,
          targetId: entry.targetId,
          segment: entry.segment,
          beforeValue: entry.afterValue,
          afterValue: entry.beforeValue,
          postRevision: revision,
          sequence: reverted,
          createdAt: now,
        });
        reverted += 1;
        continue;
      }
      if (entry.targetKind === 'edge') {
        const edge = await ctx.db.get(entry.targetId as Id<'canvasEdges'>);
        if (!edge || edge.revision !== entry.postRevision) {
          skippedConflicts += 1;
          continue;
        }
        const revision = edge.revision + 1;
        if (entry.segment === 'lifecycle') {
          const before = entry.beforeValue as { isDeleted?: boolean } | null;
          await ctx.db.patch(edge._id, {
            isDeleted: before?.isDeleted ?? true,
            revision,
            updatedAt: now,
          });
        } else {
          const before = entry.beforeValue as Partial<Doc<'canvasEdges'>>;
          await ctx.db.patch(edge._id, { ...before, revision, updatedAt: now });
        }
        reverted += 1;
        continue;
      }
      skippedConflicts += 1;
    }
    await ctx.db.patch(original._id, {
      state: skippedConflicts > 0 ? 'partially_undone' : 'undone',
    });
    await ctx.db.insert('activityEvents', {
      workspaceId: original.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source: 'undo',
      eventType: 'change_set_undone',
      summary: `Undid ${reverted} change${reverted === 1 ? '' : 's'}; skipped ${skippedConflicts} conflict${skippedConflicts === 1 ? '' : 's'}`,
      changeSetId: undoChangeSetId,
      ...(original.teamRunId ? { teamRunId: original.teamRunId } : {}),
      ...(original.jobId ? { jobId: original.jobId } : {}),
      createdAt: now,
    });
    return { undoChangeSetId, reverted, skippedConflicts, idempotentReplay: false };
  },
});
