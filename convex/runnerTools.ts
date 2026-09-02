import { v } from 'convex/values';

import { buildNodeColorGuide } from '../src/domain/palette';
import { query } from './_generated/server';
import { requireWorkerAuthorization } from './lib/runnerAuth';
import { workerAuthorizationValidator } from './validators';

export const getWorkspaceContext = query({
  args: { workerAuthorization: workerAuthorizationValidator, limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const worker = await requireWorkerAuthorization(ctx, args.workerAuthorization);
    const limit = Math.max(1, Math.min(args.limit ?? 100, 200));
    const workspace = await ctx.db.get(worker.job.workspaceId);
    if (!workspace) throw new Error('workspace_not_found');
    const allObjects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', worker.job.workspaceId).eq('isDeleted', false),
      )
      .take(600);
    const objects = allObjects.slice(0, limit);
    const objectIds = new Set(objects.map((object) => object._id));
    const edges = (
      await ctx.db
        .query('canvasEdges')
        .withIndex('by_workspaceId_and_isDeleted', (index) =>
          index.eq('workspaceId', worker.job.workspaceId).eq('isDeleted', false),
        )
        .take(1_000)
    ).filter((edge) => objectIds.has(edge.sourceObjectId) && objectIds.has(edge.targetObjectId));
    return {
      workspace: { id: workspace._id, title: workspace.title, boardMode: workspace.boardMode },
      assignment: {
        jobId: worker.job._id,
        runId: worker.job.teamRunId,
        roleProfileId: worker.job.roleProfileId,
        targetSectionId: worker.job.targetSectionId,
        brief: worker.job.brief,
        workspaceDigest: worker.job.workspaceDigest,
        expectedArtifactTypes: worker.job.expectedArtifactTypes,
        reservedRegion: worker.reservation.bounds,
      },
      objects,
      edges,
      colorGuide: buildNodeColorGuide(),
    };
  },
});

export const searchCanvas = query({
  args: {
    workerAuthorization: workerAuthorizationValidator,
    search: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const worker = await requireWorkerAuthorization(ctx, args.workerAuthorization);
    const needle = args.search.trim().toLocaleLowerCase();
    if (!needle) return [];
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', worker.job.workspaceId).eq('isDeleted', false),
      )
      .take(600);
    return objects
      .filter((object) =>
        [
          object.title,
          object.type,
          object.variant,
          object.semantics.semanticType,
          object.semantics.projectArea,
          object.semantics.status,
        ].some((value) => value?.toLocaleLowerCase().includes(needle)),
      )
      .slice(0, limit);
  },
});
