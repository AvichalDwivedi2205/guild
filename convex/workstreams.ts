import { v } from 'convex/values';

import { engineLabel, projectRunnerWorkstream } from '../src/domain/workstreams';
import { deriveExternalWorkstreamStatus } from '../src/domain/workstream-staleness';
import { requireWorkspaceMember } from './lib/auth';
import { limits } from './lib/policies';
import { query } from './_generated/server';

export const list = query({
  args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      source: v.union(v.literal('runner_job'), v.literal('webmcp_controller')),
      roleName: v.string(),
      engineLabel: v.string(),
      objective: v.string(),
      status: v.string(),
      provenance: v.union(v.literal('authoritative'), v.literal('reported')),
      latestProgress: v.union(v.string(), v.null()),
      lastUpdate: v.number(),
      targetObjectId: v.union(v.string(), v.null()),
      dependencyCount: v.number(),
      artifactCount: v.number(),
      reviewNeeded: v.boolean(),
      error: v.union(v.string(), v.null()),
      jobId: v.optional(v.string()),
      runId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_workspaceId_and_state', (index) => index.eq('workspaceId', args.workspaceId))
      .take(Math.max(1, Math.min(args.limit ?? 50, 100)));
    const views = [];
    for (const job of jobs.slice(0, limits.jobsPerRun * 4)) {
      const role = await ctx.db.get(job.roleProfileId);
      const artifacts = await ctx.db
        .query('canvasObjects')
        .withIndex('by_createdByJobId', (index) => index.eq('createdByJobId', job._id))
        .take(50);
      views.push(
        projectRunnerWorkstream({
          id: job._id,
          runId: job.teamRunId,
          roleName: role?.name ?? engineLabel(job.engine),
          engine: job.engine,
          state: job.state,
          waitingForRunner: false,
          brief: job.brief,
          progressMessage: job.progressMessage ?? null,
          errorMessage: job.errorMessage ?? null,
          targetObjectId: job.targetSectionId,
          dependencyJobIds: job.dependencyJobIds,
          artifactCount: artifacts.filter((object) => !object.isDeleted).length,
          updatedAt: job.updatedAt,
        }),
      );
    }
    const external = await ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_state', (index) => index.eq('workspaceId', args.workspaceId))
      .take(50);
    const now = Date.now();
    for (const stream of external) {
      views.push({
        id: stream._id,
        source: 'webmcp_controller' as const,
        roleName: stream.roleLabel,
        engineLabel: stream.engineLabel === 'claude' ? 'Claude Sonnet' : 'Codex',
        objective: stream.objective,
        status: deriveExternalWorkstreamStatus({
          state: stream.state,
          lastReceivedAt: stream.lastReceivedAt,
          now,
        }),
        provenance: 'reported' as const,
        latestProgress: stream.objective,
        lastUpdate: stream.lastReceivedAt,
        targetObjectId: stream.targetObjectId ?? null,
        dependencyCount: 0,
        artifactCount: 0,
        reviewNeeded: stream.state === 'completed',
        error: null,
      });
    }
    return views.sort((left, right) => right.lastUpdate - left.lastUpdate);
  },
});
