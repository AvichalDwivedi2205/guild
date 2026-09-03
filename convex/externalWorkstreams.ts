import { externalWorkstreamRequestSchemas } from '@guild/protocol';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { deriveExternalWorkstreamStatus } from '../src/domain/workstream-staleness';
import { requireWorkspaceMember } from './lib/auth';
import { appendActivity, appendChange, resolveCommandPrincipal } from './lib/commands';
import { hashWorkspaceRequest, recordWorkspaceMutation } from './lib/recorder';

export const registerWorkstream = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    idempotencyKey: v.string(),
    workstreamKey: v.string(),
    roleLabel: v.string(),
    engineLabel: v.union(v.literal('codex'), v.literal('claude')),
    objective: v.string(),
    targetObjectId: v.optional(v.string()),
    eventTime: v.number(),
  },
  handler: async (ctx, args) => {
    const request = externalWorkstreamRequestSchemas.registerWorkstream.parse(args);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'webmcp');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'externalWorkstreams.register',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'externalWorkstreams.register',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: `Registered workstream ${request.workstreamKey}`,
      apply: async ({ changeSetId }) => {
        const existing = await ctx.db
          .query('externalWorkstreams')
          .withIndex('by_workspaceId_and_key', (query) =>
            query.eq('workspaceId', args.workspaceId).eq('key', request.workstreamKey),
          )
          .unique();
        if (existing) throw new Error('workstream_exists');
        const now = Date.now();
        const workstreamId = await ctx.db.insert('externalWorkstreams', {
          workspaceId: args.workspaceId,
          key: request.workstreamKey,
          roleLabel: request.roleLabel,
          engineLabel: request.engineLabel,
          objective: request.objective,
          state: 'reported',
          lastSequence: 0,
          lastEventTime: request.eventTime,
          lastReceivedAt: now,
          ...(request.targetObjectId
            ? { targetObjectId: request.targetObjectId as Id<'canvasObjects'> }
            : {}),
          createdAt: now,
          updatedAt: now,
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'externalWorkstream',
          targetId: workstreamId,
          segment: 'lifecycle',
          beforeValue: null,
          afterValue: { key: request.workstreamKey },
          postRevision: 0,
          sequence: 0,
        });
        await appendActivity(ctx, {
          workspaceId: args.workspaceId,
          principal,
          eventType: 'external_workstream_registered',
          summary: `Registered ${request.roleLabel}`,
          targetId: workstreamId,
          changeSetId,
        });
        return { workstreamId };
      },
    });
    if (recorded.replay)
      return { workstreamId: recorded.changed[0]?.targetId, idempotentReplay: true };
    return recorded.result;
  },
});

export const reportWorkstreamUpdate = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    idempotencyKey: v.string(),
    workstreamKey: v.string(),
    sequence: v.number(),
    phase: v.string(),
    summary: v.string(),
    targetObjectIds: v.optional(v.array(v.string())),
    artifactObjectIds: v.optional(v.array(v.string())),
    eventTime: v.number(),
  },
  handler: async (ctx, args) => {
    const request = externalWorkstreamRequestSchemas.reportWorkstreamUpdate.parse(args);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'webmcp');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'externalWorkstreams.update',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'externalWorkstreams.update',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: request.summary,
      apply: async ({ changeSetId }) => {
        const stream = await requireStream(ctx, args.workspaceId, request.workstreamKey);
        if (request.sequence !== stream.lastSequence + 1) throw new Error('sequence_mismatch');
        if (request.eventTime < stream.lastEventTime) throw new Error('event_time_regression');
        const now = Date.now();
        await ctx.db.insert('workstreamUpdates', {
          workspaceId: args.workspaceId,
          workstreamId: stream._id,
          sequence: request.sequence,
          phase: request.phase,
          summary: request.summary,
          eventTime: request.eventTime,
          receivedAt: now,
          changeSetId,
        });
        await ctx.db.patch(stream._id, {
          lastSequence: request.sequence,
          lastEventTime: request.eventTime,
          lastReceivedAt: now,
          state: 'reported',
          updatedAt: now,
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'externalWorkstream',
          targetId: stream._id,
          segment: 'content',
          beforeValue: { sequence: stream.lastSequence },
          afterValue: { sequence: request.sequence, summary: request.summary },
          postRevision: request.sequence,
          sequence: 0,
        });
        return { workstreamId: stream._id, sequence: request.sequence };
      },
    });
    if (recorded.replay) return { sequence: request.sequence, idempotentReplay: true };
    return recorded.result;
  },
});

export const completeWorkstream = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    idempotencyKey: v.string(),
    workstreamKey: v.string(),
    sequence: v.number(),
    summary: v.string(),
    state: v.union(v.literal('completed'), v.literal('blocked'), v.literal('cancelled')),
    eventTime: v.number(),
  },
  handler: async (ctx, args) => {
    const request = externalWorkstreamRequestSchemas.completeWorkstream.parse(args);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'webmcp');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'externalWorkstreams.complete',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'externalWorkstreams.complete',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: request.summary,
      apply: async ({ changeSetId }) => {
        const stream = await requireStream(ctx, args.workspaceId, request.workstreamKey);
        if (request.sequence !== stream.lastSequence + 1) throw new Error('sequence_mismatch');
        const now = Date.now();
        await ctx.db.patch(stream._id, {
          state: request.state,
          lastSequence: request.sequence,
          lastEventTime: request.eventTime,
          lastReceivedAt: now,
          updatedAt: now,
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'externalWorkstream',
          targetId: stream._id,
          segment: 'lifecycle',
          beforeValue: { state: stream.state },
          afterValue: { state: request.state },
          postRevision: request.sequence,
          sequence: 0,
        });
        return { workstreamId: stream._id, state: request.state };
      },
    });
    if (recorded.replay) return { state: request.state, idempotentReplay: true };
    return recorded.result;
  },
});

export const getWorkstreamFeedback = query({
  args: {
    workspaceId: v.id('workspaces'),
    workstreamKey: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    externalWorkstreamRequestSchemas.getWorkstreamFeedback.parse({
      ...args,
      limit: args.limit ?? 20,
    });
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const stream = await ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_key', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('key', args.workstreamKey),
      )
      .unique();
    if (!stream) return { items: [] };
    const items = await ctx.db
      .query('externalWorkstreamFeedback')
      .withIndex('by_workstreamId_and_state', (query) => query.eq('workstreamId', stream._id))
      .take(args.limit ?? 20);
    return {
      items: await Promise.all(
        items.map(async (item) => {
          const source = await ctx.db.get(item.sourceCommentId);
          const comments = source?.feedbackBatchKey
            ? await ctx.db
                .query('comments')
                .withIndex('by_workspaceId_and_triggerKey', (query) =>
                  query
                    .eq('workspaceId', args.workspaceId)
                    .eq('triggerKey', source.feedbackBatchKey),
                )
                .take(50)
            : source
              ? [source]
              : [];
          const annotated = await Promise.all(
            comments.map(async (comment) => {
              const anchor = comment.visualAnchorId
                ? await ctx.db.get(comment.visualAnchorId)
                : null;
              return {
                id: comment._id,
                body: comment.body,
                targetObjectId: comment.objectId ?? null,
                anchor: anchor
                  ? {
                      surface: anchor.surface ?? 'design',
                      kind: anchor.kind,
                      screenRevisionId: anchor.designScreenRevisionId ?? null,
                      screenKey: anchor.screenKey ?? null,
                      route: anchor.route ?? null,
                      point:
                        anchor.pointX !== undefined && anchor.pointY !== undefined
                          ? { x: anchor.pointX, y: anchor.pointY }
                          : null,
                      rectangle:
                        anchor.rectX !== undefined &&
                        anchor.rectY !== undefined &&
                        anchor.rectWidth !== undefined &&
                        anchor.rectHeight !== undefined
                          ? {
                              x: anchor.rectX,
                              y: anchor.rectY,
                              width: anchor.rectWidth,
                              height: anchor.rectHeight,
                            }
                          : null,
                    }
                  : null,
              };
            }),
          );
          return {
            id: item._id,
            state: item.state,
            body: item.body,
            comments: annotated,
            overallInstruction: source?.feedbackOverallInstruction ?? null,
            createdAt: item.createdAt,
            acknowledgedAt: item.acknowledgedAt ?? null,
          };
        }),
      ),
    };
  },
});

export const acknowledgeWorkstreamFeedback = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    idempotencyKey: v.string(),
    feedbackId: v.string(),
    eventTime: v.number(),
  },
  handler: async (ctx, args) => {
    const request = externalWorkstreamRequestSchemas.acknowledgeWorkstreamFeedback.parse(args);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'webmcp');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'externalWorkstreams.acknowledge',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'externalWorkstreams.acknowledge',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: 'Acknowledged workstream feedback',
      apply: async ({ changeSetId }) => {
        const feedback = await ctx.db.get(request.feedbackId as Id<'externalWorkstreamFeedback'>);
        if (!feedback || feedback.workspaceId !== args.workspaceId) {
          throw new Error('feedback_not_found');
        }
        await ctx.db.patch(feedback._id, {
          state: 'acknowledged',
          acknowledgedAt: Date.now(),
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'externalWorkstream',
          targetId: feedback._id,
          segment: 'lifecycle',
          beforeValue: { state: feedback.state },
          afterValue: { state: 'acknowledged' },
          postRevision: 1,
          sequence: 0,
        });
        return { feedbackId: feedback._id, state: 'acknowledged' as const };
      },
    });
    if (recorded.replay) return { feedbackId: request.feedbackId, idempotentReplay: true };
    return recorded.result;
  },
});

export const listExternal = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const rows = await ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_state', (query) => query.eq('workspaceId', args.workspaceId))
      .take(50);
    const now = Date.now();
    return rows.map((row) => ({
      id: row._id,
      key: row.key,
      roleLabel: row.roleLabel,
      engineLabel: row.engineLabel,
      objective: row.objective,
      state: deriveExternalWorkstreamStatus({
        state: row.state,
        lastReceivedAt: row.lastReceivedAt,
        now,
      }),
      provenance: 'reported' as const,
      lastUpdate: row.lastReceivedAt,
      targetObjectId: row.targetObjectId ?? null,
    }));
  },
});

async function requireStream(
  ctx: { db: { query: MutationCtx['db']['query'] } },
  workspaceId: Id<'workspaces'>,
  key: string,
) {
  const stream = await ctx.db
    .query('externalWorkstreams')
    .withIndex('by_workspaceId_and_key', (query) =>
      query.eq('workspaceId', workspaceId).eq('key', key),
    )
    .unique();
  if (!stream) throw new Error('workstream_not_found');
  return stream;
}
