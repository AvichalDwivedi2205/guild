import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { classifyRevisionComment } from '../src/domain/design-review';
import { appendActivity, appendChange, resolveCommandPrincipal } from './lib/commands';
import { hashWorkspaceRequest, recordWorkspaceMutation } from './lib/recorder';

export const approveDesignRevision = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    designSetKey: v.string(),
    version: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'ui');
    if (principal.kind !== 'human') throw new Error('human_approval_required');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'designReview.approveDesignRevision',
      workspaceId: args.workspaceId,
      designSetKey: args.designSetKey,
      version: args.version,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'designReview.approveDesignRevision',
      idempotencyKey: args.idempotencyKey,
      requestHash,
      summary: `Approved ${args.designSetKey} v${args.version}`,
      apply: async ({ changeSetId }) => {
        const designSet = await requireDesignSet(ctx, args.workspaceId, args.designSetKey);
        const revision = await requireRevision(ctx, designSet._id, args.version);
        const existing = await ctx.db
          .query('designReviewDecisions')
          .withIndex('by_revision_and_createdAt', (query) =>
            query.eq('designRevisionId', revision._id),
          )
          .take(10);
        if (existing.some((row) => row.decision === 'approved')) {
          throw new Error('already_approved');
        }
        const decisionId = await ctx.db.insert('designReviewDecisions', {
          workspaceId: args.workspaceId,
          designRevisionId: revision._id,
          decision: 'approved',
          actorUserId: principal.userId,
          createdAt: Date.now(),
        });
        await ctx.db.patch(designSet._id, {
          approvedRevisionId: revision._id,
          updatedAt: Date.now(),
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'reviewDecision',
          targetId: decisionId,
          segment: 'lifecycle',
          beforeValue: null,
          afterValue: { version: args.version, decision: 'approved' },
          postRevision: args.version,
          sequence: 0,
        });
        await appendActivity(ctx, {
          workspaceId: args.workspaceId,
          principal,
          eventType: 'design_revision_approved',
          summary: `Approved ${args.designSetKey} v${args.version}`,
          targetId: revision._id,
          changeSetId,
        });
        return { decisionId, designRevisionId: revision._id, version: args.version };
      },
    });
    if (recorded.replay) {
      const decisionId = recorded.changed[0]?.targetId as Id<'designReviewDecisions'> | undefined;
      const decision = decisionId ? await ctx.db.get(decisionId) : null;
      if (!decision || decision.workspaceId !== args.workspaceId) {
        throw new Error('approval_receipt_missing');
      }
      return {
        decisionId,
        designRevisionId: decision.designRevisionId,
        version: args.version,
        idempotentReplay: true,
      };
    }
    return { ...recorded.result, idempotentReplay: false };
  },
});

export const requestDesignChanges = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    designSetKey: v.string(),
    version: v.number(),
    note: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'ui');
    if (principal.kind !== 'human') throw new Error('human_approval_required');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'designReview.requestDesignChanges',
      ...args,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'designReview.requestDesignChanges',
      idempotencyKey: args.idempotencyKey,
      requestHash,
      summary: `Requested changes on ${args.designSetKey} v${args.version}`,
      apply: async ({ changeSetId }) => {
        const designSet = await requireDesignSet(ctx, args.workspaceId, args.designSetKey);
        const revision = await requireRevision(ctx, designSet._id, args.version);
        const decisionId = await ctx.db.insert('designReviewDecisions', {
          workspaceId: args.workspaceId,
          designRevisionId: revision._id,
          decision: 'changes_requested',
          actorUserId: principal.userId,
          note: args.note.slice(0, 2_000),
          createdAt: Date.now(),
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'reviewDecision',
          targetId: decisionId,
          segment: 'lifecycle',
          beforeValue: null,
          afterValue: { version: args.version, decision: 'changes_requested' },
          postRevision: args.version,
          sequence: 0,
        });
        return { decisionId, designRevisionId: revision._id };
      },
    });
    if (recorded.replay) {
      const decisionId = recorded.changed[0]?.targetId as Id<'designReviewDecisions'> | undefined;
      const decision = decisionId ? await ctx.db.get(decisionId) : null;
      if (!decision || decision.workspaceId !== args.workspaceId) {
        throw new Error('review_receipt_missing');
      }
      return {
        decisionId: decision._id,
        designRevisionId: decision.designRevisionId,
        idempotentReplay: true,
      };
    }
    return { ...recorded.result, idempotentReplay: false };
  },
});

export const restoreDesignRevision = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    designSetKey: v.string(),
    version: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'ui');
    if (principal.kind !== 'human') throw new Error('human_approval_required');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'designReview.restoreDesignRevision',
      workspaceId: args.workspaceId,
      designSetKey: args.designSetKey,
      version: args.version,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'designReview.restoreDesignRevision',
      idempotencyKey: args.idempotencyKey,
      requestHash,
      summary: `Restored ${args.designSetKey} v${args.version}`,
      apply: async ({ changeSetId }) => {
        const designSet = await requireDesignSet(ctx, args.workspaceId, args.designSetKey);
        const source = await requireRevision(ctx, designSet._id, args.version);
        const head = designSet.headRevisionId ? await ctx.db.get(designSet.headRevisionId) : null;
        const nextVersion = (head?.version ?? source.version) + 1;
        const now = Date.now();
        const restoredId = await ctx.db.insert('designRevisions', {
          workspaceId: args.workspaceId,
          designSetId: designSet._id,
          version: nextVersion,
          stage: source.stage,
          ...(head?._id ? { priorRevisionId: head._id } : {}),
          restoredFromRevisionId: source._id,
          deploymentId: source.deploymentId,
          deploymentUrl: source.deploymentUrl,
          origin: source.origin,
          publisherKind: 'human',
          publisherUserId: principal.userId,
          changeSetId,
          createdAt: now,
        });
        const screenRevisions = await ctx.db
          .query('designScreenRevisions')
          .withIndex('by_revision_and_screen', (query) => query.eq('designRevisionId', source._id))
          .take(40);
        for (const revision of screenRevisions) {
          await ctx.db.insert('designScreenRevisions', {
            workspaceId: args.workspaceId,
            designRevisionId: restoredId,
            designScreenId: revision.designScreenId,
            route: revision.route,
            viewports: revision.viewports,
            captureReady: false,
          });
        }
        await ctx.db.patch(designSet._id, { headRevisionId: restoredId, updatedAt: now });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'designPointer',
          targetId: restoredId,
          segment: 'lifecycle',
          beforeValue: { version: head?.version ?? source.version },
          afterValue: { version: nextVersion, restoredFromRevisionId: source._id },
          postRevision: nextVersion,
          sequence: 0,
        });
        return { designRevisionId: restoredId, version: nextVersion };
      },
    });
    if (recorded.replay) {
      const revisionId = recorded.changed[0]?.targetId as Id<'designRevisions'> | undefined;
      const revision = revisionId ? await ctx.db.get(revisionId) : null;
      if (!revision || revision.workspaceId !== args.workspaceId) {
        throw new Error('restore_receipt_missing');
      }
      return {
        designRevisionId: revision._id,
        version: revision.version,
        idempotentReplay: true,
      };
    }
    return { ...recorded.result, idempotentReplay: false };
  },
});

export const classifyRevisionComments = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    designRevisionId: v.id('designRevisions'),
    addressedCommentIds: v.array(v.id('comments')),
    changedScreenKeys: v.array(v.string()),
    presentScreenKeys: v.array(v.string()),
    commentIds: v.array(v.id('comments')),
  },
  handler: async (ctx, args) => {
    await resolveCommandPrincipal(ctx, args.workspaceId, 'ui');
    for (const commentId of args.commentIds) {
      const classification = classifyRevisionComment({
        addressedCommentIds: args.addressedCommentIds,
        commentId,
        screenChanged: args.changedScreenKeys.length > 0,
        sameScreenExists: args.presentScreenKeys.length > 0,
      });
      await ctx.db.insert('designRevisionComments', {
        workspaceId: args.workspaceId,
        designRevisionId: args.designRevisionId,
        commentId,
        classification,
        createdAt: Date.now(),
      });
    }
    return { classified: args.commentIds.length };
  },
});

export const getReviewDecisions = query({
  args: {
    workspaceId: v.id('workspaces'),
    designRevisionId: v.id('designRevisions'),
  },
  handler: async (ctx, args) => {
    const { requireWorkspaceMember } = await import('./lib/auth');
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    return ctx.db
      .query('designReviewDecisions')
      .withIndex('by_revision_and_createdAt', (query) =>
        query.eq('designRevisionId', args.designRevisionId),
      )
      .take(20);
  },
});

async function requireDesignSet(
  ctx: { db: { query: MutationCtx['db']['query'] } },
  workspaceId: Id<'workspaces'>,
  key: string,
) {
  const designSet = await ctx.db
    .query('designSets')
    .withIndex('by_workspaceId_and_key', (query) =>
      query.eq('workspaceId', workspaceId).eq('key', key),
    )
    .unique();
  if (!designSet) throw new Error('design_set_not_found');
  return designSet;
}

async function requireRevision(
  ctx: { db: { query: MutationCtx['db']['query']; get: MutationCtx['db']['get'] } },
  designSetId: Id<'designSets'>,
  version: number,
) {
  const revision = await ctx.db
    .query('designRevisions')
    .withIndex('by_designSetId_and_version', (query) =>
      query.eq('designSetId', designSetId).eq('version', version),
    )
    .unique();
  if (!revision) throw new Error('design_revision_not_found');
  return revision;
}
