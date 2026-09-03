import { dispatchFeedbackBatchRequestSchema, type FeedbackReference } from '@guild/protocol';
import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, type MutationCtx } from './_generated/server';
import { buildFeedbackBrief, groupFeedbackItems } from '../src/domain/feedback-batch';
import { appendActivity, appendChange, resolveCommandPrincipal } from './lib/commands';
import { findExternalWorkstreamForObject } from './lib/externalFeedback';
import { hashWorkspaceRequest, recordWorkspaceMutation } from './lib/recorder';
import { createTeamRun } from './lib/runLifecycle';

type ResolvedItem = {
  id: string;
  body: string;
  targetObjectId: Id<'canvasObjects'>;
  object: Doc<'canvasObjects'>;
  reference?: FeedbackReference;
  target: { kind: 'role' | 'workstream'; id: string };
  targetTitle: string;
  anchorDescription: string;
};

function describeAnchor(reference: FeedbackReference | undefined) {
  if (!reference) return 'whole object';
  const geometry = reference.point
    ? `point x=${reference.point.x.toFixed(3)} y=${reference.point.y.toFixed(3)}`
    : reference.rectangle
      ? `rectangle x=${reference.rectangle.x.toFixed(3)} y=${reference.rectangle.y.toFixed(3)} width=${reference.rectangle.width.toFixed(3)} height=${reference.rectangle.height.toFixed(3)}`
      : reference.kind;
  return reference.surface === 'design'
    ? `${geometry} on ${reference.route} (${reference.viewportKey}, screen ${reference.screenKey}, revision ${reference.screenRevisionId})`
    : `${geometry} on canvas object`;
}

async function resolveItems(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  items: ReturnType<typeof dispatchFeedbackBatchRequestSchema.parse>['items'],
): Promise<ResolvedItem[]> {
  const resolved: ResolvedItem[] = [];
  for (const [index, item] of items.entries()) {
    const targetObjectId = item.targetObjectId as Id<'canvasObjects'>;
    const object = await ctx.db.get(targetObjectId);
    if (!object || object.workspaceId !== workspaceId || object.isDeleted) {
      throw new Error('feedback_target_not_found');
    }
    if (item.reference?.surface === 'design') {
      const screenRevision = await ctx.db.get(
        item.reference.screenRevisionId as Id<'designScreenRevisions'>,
      );
      if (!screenRevision || screenRevision.workspaceId !== workspaceId) {
        throw new Error('design_revision_not_found');
      }
    }

    let target: ResolvedItem['target'] | undefined;
    let ownerCandidate: Doc<'canvasObjects'> | null = object;
    for (let depth = 0; ownerCandidate && depth <= 8 && !target; depth += 1) {
      const ownerId = ownerCandidate.semantics.ownerRoleProfileId;
      if (ownerId) {
        const role = await ctx.db.get(ownerId);
        if (role && role.workspaceId === workspaceId) target = { kind: 'role', id: role._id };
      }
      if (!target && ownerCandidate.createdByJobId) {
        const job = await ctx.db.get(ownerCandidate.createdByJobId);
        if (job && job.workspaceId === workspaceId) {
          target = { kind: 'role', id: job.roleProfileId };
        }
      }
      ownerCandidate = ownerCandidate.parentId ? await ctx.db.get(ownerCandidate.parentId) : null;
    }
    if (!target) {
      const stream = await findExternalWorkstreamForObject(ctx, workspaceId, targetObjectId, {
        ...(item.reference?.surface === 'design' ? { preferredEngine: 'claude' as const } : {}),
      });
      if (stream) target = { kind: 'workstream', id: stream._id };
    }
    if (!target) throw new Error('feedback_target_unassigned');

    resolved.push({
      id: String(index),
      body: item.body.trim(),
      targetObjectId,
      object,
      ...(item.reference ? { reference: item.reference } : {}),
      target,
      targetTitle: object.title?.trim() || object.type,
      anchorDescription: describeAnchor(item.reference),
    });
  }
  return resolved;
}

async function replayResult(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  changeSetId: Id<'changeSets'>,
) {
  const batchKey = `feedback:${changeSetId}`;
  const comments = await ctx.db
    .query('comments')
    .withIndex('by_workspaceId_and_triggerKey', (query) =>
      query.eq('workspaceId', workspaceId).eq('triggerKey', batchKey),
    )
    .take(50);
  const jobIds = [...new Set(comments.flatMap((comment) => comment.jobIds))];
  const feedbackRows = await Promise.all(
    comments.map((comment) =>
      ctx.db
        .query('externalWorkstreamFeedback')
        .withIndex('by_sourceCommentId', (query) => query.eq('sourceCommentId', comment._id))
        .unique(),
    ),
  );
  return {
    changeSetId,
    commentIds: comments.map((comment) => comment._id),
    jobIds,
    feedbackIds: feedbackRows.filter(Boolean).map((item) => item!._id),
    idempotentReplay: true,
  };
}

export const dispatchBatch = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    source: v.union(v.literal('ui'), v.literal('webmcp')),
    idempotencyKey: v.string(),
    overallInstruction: v.optional(v.string()),
    items: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const request = dispatchFeedbackBatchRequestSchema.parse(args);
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, args.source);
    if (principal.kind === 'worker') throw new Error('forbidden');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'feedback.dispatchBatch',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'feedback.dispatchBatch',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: `Sent ${request.items.length} feedback note${request.items.length === 1 ? '' : 's'}`,
      apply: async ({ changeSetId }) => {
        const resolved = await resolveItems(ctx, args.workspaceId, request.items);
        const batchKey = `feedback:${changeSetId}`;
        const now = Date.now();
        const created = [] as (ResolvedItem & {
          commentId: Id<'comments'>;
          anchorId?: Id<'visualAnchors'>;
        })[];
        let sequence = 0;

        for (const item of resolved) {
          const commentId = await ctx.db.insert('comments', {
            workspaceId: args.workspaceId,
            targetType: 'object',
            objectId: item.targetObjectId,
            authorKind: principal.kind,
            authorUserId: principal.userId,
            mentionedRoleProfileIds:
              item.target.kind === 'role' ? [item.target.id as Id<'roleProfiles'>] : [],
            body: item.body,
            state: 'open',
            revision: 0,
            triggerKey: batchKey,
            feedbackBatchKey: batchKey,
            ...(request.overallInstruction
              ? { feedbackOverallInstruction: request.overallInstruction.trim() }
              : {}),
            jobIds: [],
            createdAt: now,
            updatedAt: now,
          });
          let anchorId: Id<'visualAnchors'> | undefined;
          if (item.reference) {
            const reference = item.reference;
            anchorId = await ctx.db.insert('visualAnchors', {
              workspaceId: args.workspaceId,
              commentId,
              targetObjectId: item.targetObjectId,
              surface: reference.surface,
              targetRevisions: {
                geometry: item.object.geometryRevision,
                content: item.object.contentRevision,
                style: item.object.styleRevision,
                semantics: item.object.semanticsRevision,
                hierarchy: item.object.hierarchyRevision,
              },
              ...(reference.surface === 'design'
                ? {
                    designScreenRevisionId:
                      reference.screenRevisionId as Id<'designScreenRevisions'>,
                    screenKey: reference.screenKey,
                    route: reference.route,
                    viewportKey: reference.viewportKey,
                    viewportWidth: reference.viewportWidth,
                    viewportHeight: reference.viewportHeight,
                    scrollX: reference.scrollX,
                    scrollY: reference.scrollY,
                    ...(reference.stableElementId
                      ? { stableElementId: reference.stableElementId }
                      : {}),
                  }
                : {}),
              kind: reference.kind,
              ...(reference.point ? { pointX: reference.point.x, pointY: reference.point.y } : {}),
              ...(reference.rectangle
                ? {
                    rectX: reference.rectangle.x,
                    rectY: reference.rectangle.y,
                    rectWidth: reference.rectangle.width,
                    rectHeight: reference.rectangle.height,
                  }
                : {}),
              detached: false,
              createdAt: now,
            });
            await ctx.db.patch(commentId, { visualAnchorId: anchorId });
            await appendChange(ctx, {
              workspaceId: args.workspaceId,
              changeSetId,
              targetKind: 'visualAnchor',
              targetId: anchorId,
              segment: 'lifecycle',
              beforeValue: null,
              afterValue: { commentId, targetObjectId: item.targetObjectId },
              postRevision: 0,
              sequence: sequence++,
            });
          }
          await ctx.db.patch(commentId, { threadRootId: commentId });
          await appendChange(ctx, {
            workspaceId: args.workspaceId,
            changeSetId,
            targetKind: 'comment',
            targetId: commentId,
            segment: 'lifecycle',
            beforeValue: null,
            afterValue: { body: item.body, feedbackBatchKey: batchKey },
            postRevision: 0,
            sequence: sequence++,
          });
          created.push({ ...item, commentId, ...(anchorId ? { anchorId } : {}) });
        }

        const jobIds: Id<'jobs'>[] = [];
        const feedbackIds: Id<'externalWorkstreamFeedback'>[] = [];
        for (const group of groupFeedbackItems(created)) {
          const brief = buildFeedbackBrief({
            ...(request.overallInstruction
              ? { overallInstruction: request.overallInstruction }
              : {}),
            items: group.items,
          });
          if (group.target.kind === 'role') {
            const roleId = group.target.id as Id<'roleProfiles'>;
            const role = await ctx.db.get(roleId);
            if (!role || role.workspaceId !== args.workspaceId) throw new Error('role_not_found');
            const started = await createTeamRun(ctx, {
              workspaceId: args.workspaceId,
              roleProfileIds: [roleId],
              brief,
              trigger: 'comment_owner',
              triggerKey: `${batchKey}:role:${roleId}`,
              createdByUserId: principal.userId,
              source: principal.source,
              targetObjectId: role.ownedSectionId,
            });
            jobIds.push(...started.jobIds);
            for (const item of group.items) {
              await ctx.db.patch(item.commentId, {
                state: 'queued',
                teamRunId: started.runId,
                jobIds: started.jobIds,
                updatedAt: now,
              });
            }
          } else {
            const workstreamId = group.target.id as Id<'externalWorkstreams'>;
            const first = group.items[0]!;
            const feedbackId = await ctx.db.insert('externalWorkstreamFeedback', {
              workspaceId: args.workspaceId,
              workstreamId,
              sourceCommentId: first.commentId,
              ...(first.anchorId ? { visualAnchorId: first.anchorId } : {}),
              state: 'pending',
              body: brief,
              createdAt: now,
            });
            feedbackIds.push(feedbackId);
            for (const item of group.items) {
              await ctx.db.patch(item.commentId, { state: 'queued', updatedAt: now });
            }
          }
        }

        await appendActivity(ctx, {
          workspaceId: args.workspaceId,
          principal,
          eventType: 'feedback_batch_dispatched',
          summary: `Sent ${created.length} feedback note${created.length === 1 ? '' : 's'} to ${groupFeedbackItems(created).length} agent${groupFeedbackItems(created).length === 1 ? '' : 's'}`,
          changeSetId,
        });
        return {
          changeSetId,
          commentIds: created.map((item) => item.commentId),
          jobIds,
          feedbackIds,
          idempotentReplay: false,
        };
      },
    });
    return recorded.replay
      ? replayResult(ctx, args.workspaceId, recorded.changeSetId)
      : recorded.result;
  },
});
