import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { createContentPreview, parseContentSnapshot } from './lib/content';
import { reconcileTeamRun, releaseJobAuthority } from './lib/jobLifecycle';
import { createTeamRun } from './lib/runLifecycle';
import { limits } from './lib/policies';
import { assertCanvasObjectCanBeDeleted } from './lib/roleOwnership';

async function runJobs(ctx: QueryCtx, teamRunId: Id<'teamRuns'>) {
  return await ctx.db
    .query('jobs')
    .withIndex('by_teamRunId', (index) => index.eq('teamRunId', teamRunId))
    .take(limits.jobsPerRun);
}

async function availableRunners(ctx: QueryCtx): Promise<Doc<'runners'>[]> {
  const [online, busy] = await Promise.all([
    ctx.db
      .query('runners')
      .withIndex('by_status_and_lastHeartbeatAt', (query) => query.eq('status', 'online'))
      .take(100),
    ctx.db
      .query('runners')
      .withIndex('by_status_and_lastHeartbeatAt', (query) => query.eq('status', 'busy'))
      .take(100),
  ]);
  return [...online, ...busy];
}

function compatibleRunnerExists(job: Doc<'jobs'>, runners: readonly Doc<'runners'>[]): boolean {
  const now = Date.now();
  return runners.some(
    (runner) =>
      (runner.status === 'online' || runner.status === 'busy') &&
      now - runner.lastHeartbeatAt < 30_000 &&
      runner.allowedWorkspaceIds.includes(job.workspaceId) &&
      runner.engines.some((report) => report.engine === job.engine && report.authState === 'ready'),
  );
}

async function jobsWithRuntimeState(
  ctx: QueryCtx,
  jobs: readonly Doc<'jobs'>[],
  runners: readonly Doc<'runners'>[],
) {
  return await Promise.all(
    jobs.map(async (job) => {
      const reservation = await ctx.db
        .query('canvasReservations')
        .withIndex('by_jobId', (index) => index.eq('jobId', job._id))
        .unique();
      return {
        ...job,
        waitingForRunner: job.state === 'queued' ? !compatibleRunnerExists(job, runners) : false,
        reservation: reservation
          ? { bounds: reservation.bounds, status: reservation.status }
          : null,
      };
    }),
  );
}

export const list = query({
  args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const [runs, runners] = await Promise.all([
      ctx.db
        .query('teamRuns')
        .withIndex('by_workspaceId', (index) => index.eq('workspaceId', args.workspaceId))
        .order('desc')
        .take(Math.max(1, Math.min(args.limit ?? 25, 100))),
      availableRunners(ctx),
    ]);
    return await Promise.all(
      runs.map(async (run) => {
        const jobs = await runJobs(ctx, run._id);
        const jobStatuses = await jobsWithRuntimeState(ctx, jobs, runners);
        return {
          run,
          jobs: jobStatuses,
          waitingForRunner: jobStatuses.some((job) => job.waitingForRunner),
        };
      }),
    );
  },
});

export const listWorkerPresence = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(
    v.object({
      jobId: v.id('jobs'),
      attempt: v.number(),
      targetObjectId: v.optional(v.id('canvasObjects')),
      progressMessage: v.string(),
      sequence: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const [leasedJobs, runningJobs, recentSteps] = await Promise.all([
      ctx.db
        .query('jobs')
        .withIndex('by_workspaceId_and_state', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('state', 'leased'),
        )
        .take(100),
      ctx.db
        .query('jobs')
        .withIndex('by_workspaceId_and_state', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('state', 'running'),
        )
        .take(100),
      ctx.db
        .query('workerSteps')
        .withIndex('by_workspaceId_and_updatedAt', (index) =>
          index.eq('workspaceId', args.workspaceId),
        )
        .order('desc')
        .take(200),
    ]);
    const activeAttemptByJob = new Map(
      [...leasedJobs, ...runningJobs].map((job) => [job._id, job.attempt]),
    );
    const seenJobs = new Set<string>();

    return recentSteps.flatMap((step) => {
      if (
        seenJobs.has(step.jobId) ||
        activeAttemptByJob.get(step.jobId) !== step.attempt ||
        step.exitState
      ) {
        return [];
      }
      seenJobs.add(step.jobId);
      return [
        {
          jobId: step.jobId,
          attempt: step.attempt,
          ...(step.targetObjectId ? { targetObjectId: step.targetObjectId } : {}),
          progressMessage: step.progressMessage,
          sequence: step.sequence,
          updatedAt: step.updatedAt,
        },
      ];
    });
  },
});

export const startTeam = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    brief: v.string(),
    roleProfileIds: v.optional(v.array(v.id('roleProfiles'))),
    teamId: v.optional(v.id('teams')),
    idempotencyKey: v.string(),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    runId: v.id('teamRuns'),
    jobIds: v.array(v.id('jobs')),
    waitingForRunner: v.boolean(),
    idempotentReplay: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    let roleProfileIds = args.roleProfileIds ?? [];
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.workspaceId !== args.workspaceId) throw new Error('team_not_found');
      if (roleProfileIds.length > 0) throw new Error('ambiguous_team_selection');
      roleProfileIds = team.roleProfileIds;
    }
    const started = await createTeamRun(ctx, {
      workspaceId: args.workspaceId,
      roleProfileIds,
      brief: args.brief,
      trigger: 'run_team',
      triggerKey: args.idempotencyKey,
      createdByUserId: user._id,
      source: args.source ?? 'ui',
      ...(args.teamId ? { teamId: args.teamId } : {}),
    });
    const jobs = await Promise.all(started.jobIds.map((jobId) => ctx.db.get(jobId)));
    const runners = await availableRunners(ctx);
    let waitingForRunner = false;
    for (const job of jobs) {
      if (job?.state === 'queued' && !compatibleRunnerExists(job, runners)) {
        waitingForRunner = true;
        break;
      }
    }
    return {
      runId: started.runId,
      jobIds: started.jobIds,
      waitingForRunner,
      idempotentReplay: started.replay,
    };
  },
});

export const assign = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    roleProfileId: v.id('roleProfiles'),
    targetObjectId: v.id('canvasObjects'),
    brief: v.string(),
    idempotencyKey: v.string(),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    runId: v.id('teamRuns'),
    jobId: v.id('jobs'),
    waitingForRunner: v.boolean(),
    idempotentReplay: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const started = await createTeamRun(ctx, {
      workspaceId: args.workspaceId,
      roleProfileIds: [args.roleProfileId],
      brief: args.brief,
      trigger: 'explicit_assignment',
      triggerKey: args.idempotencyKey,
      createdByUserId: user._id,
      source: args.source ?? 'ui',
      targetObjectId: args.targetObjectId,
    });
    const jobId = started.jobIds[0];
    if (!jobId) throw new Error('assignment_job_not_created');
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error('job_not_found');
    const runners = await availableRunners(ctx);
    return {
      runId: started.runId,
      jobId,
      waitingForRunner: job.state === 'queued' && !compatibleRunnerExists(job, runners),
      idempotentReplay: started.replay,
    };
  },
});

export const getStatus = query({
  args: { teamRunId: v.id('teamRuns') },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.teamRunId);
    if (!run) return null;
    await requireWorkspaceMember(ctx, run.workspaceId);
    const [jobs, runners] = await Promise.all([runJobs(ctx, run._id), availableRunners(ctx)]);
    const jobStatuses = await jobsWithRuntimeState(ctx, jobs, runners);
    return {
      run,
      jobs: jobStatuses,
      waitingForRunner: jobStatuses.some((job) => job.waitingForRunner),
    };
  },
});

export const stop = mutation({
  args: {
    teamRunId: v.id('teamRuns'),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.teamRunId);
    if (!run) throw new Error('run_not_found');
    const { user } = await requireWorkspaceMember(ctx, run.workspaceId, 'editor');
    if (run.state === 'cancelled') return null;
    if (run.state !== 'active') throw new Error('run_not_active');
    const now = Date.now();
    const jobs = await runJobs(ctx, run._id);
    for (const job of jobs) {
      if (['completed', 'failed', 'cancelled'].includes(job.state)) continue;
      await releaseJobAuthority(ctx, job, 'released');
      await ctx.db.patch(job._id, {
        state: 'cancelled',
        errorMessage: 'Stopped by user',
        updatedAt: now,
      });
    }
    await ctx.db.patch(run._id, { state: 'cancelled', stoppedAt: now, updatedAt: now });
    const source = args.source ?? 'ui';
    const changeSetId = await ctx.db.insert('changeSets', {
      workspaceId: run.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      teamRunId: run._id,
      source,
      idempotencyKey: `stop:${run._id}`,
      summary: 'Stopped Team Run',
      state: 'applied',
      createdAt: now,
    });
    await ctx.db.insert('activityEvents', {
      workspaceId: run.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      eventType: 'team_run_stopped',
      summary: 'Stopped Team Run',
      changeSetId,
      teamRunId: run._id,
      createdAt: now,
    });
    return null;
  },
});

export const retryJob = mutation({
  args: { jobId: v.id('jobs'), source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error('job_not_found');
    const { user } = await requireWorkspaceMember(ctx, job.workspaceId, 'editor');
    if (job.state !== 'failed') throw new Error('job_not_failed');
    const run = await ctx.db.get(job.teamRunId);
    if (!run) throw new Error('run_not_found');
    const dependencies = await Promise.all(job.dependencyJobIds.map((id) => ctx.db.get(id)));
    const state = dependencies.every((dependency) => dependency?.state === 'completed')
      ? 'queued'
      : 'blocked_by_dependency';
    const now = Date.now();
    const reservation = await ctx.db
      .query('canvasReservations')
      .withIndex('by_jobId', (index) => index.eq('jobId', job._id))
      .unique();
    if (!reservation) throw new Error('reservation_not_found');
    await ctx.db.patch(reservation._id, { status: 'reserved', updatedAt: now });
    await ctx.db.patch(job._id, {
      state,
      runnerId: undefined,
      progressMessage: undefined,
      errorMessage: undefined,
      startedAt: undefined,
      completedAt: undefined,
      updatedAt: now,
    });
    await ctx.db.patch(run._id, {
      state: 'active',
      completedAt: undefined,
      stoppedAt: undefined,
      updatedAt: now,
    });
    const source = args.source ?? 'ui';
    await ctx.db.insert('activityEvents', {
      workspaceId: job.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source,
      eventType: 'job_retried',
      summary: 'Retried Worker Job on the same configured engine',
      teamRunId: run._id,
      jobId: job._id,
      createdAt: now,
    });
    return null;
  },
});

function currentRevision(target: Doc<'canvasObjects'>, segment: Doc<'changeEntries'>['segment']) {
  if (segment === 'geometry') return target.geometryRevision;
  if (segment === 'content') return target.contentRevision;
  if (segment === 'style') return target.styleRevision;
  if (segment === 'semantics') return target.semanticsRevision;
  return target.hierarchyRevision;
}

export const undo = mutation({
  args: {
    teamRunId: v.id('teamRuns'),
    source: v.optional(v.union(v.literal('ui'), v.literal('webmcp'))),
  },
  returns: v.object({
    changeSetId: v.id('changeSets'),
    reverted: v.number(),
    skippedConflicts: v.number(),
  }),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.teamRunId);
    if (!run) throw new Error('run_not_found');
    const { user } = await requireWorkspaceMember(ctx, run.workspaceId, 'editor');
    if (run.undoneAt) {
      const existingUndo = (
        await ctx.db
          .query('changeSets')
          .withIndex('by_teamRunId', (index) => index.eq('teamRunId', run._id))
          .collect()
      ).find((changeSet) => changeSet.source === 'undo');
      if (!existingUndo) throw new Error('undo_change_set_not_found');
      return { changeSetId: existingUndo._id, reverted: 0, skippedConflicts: 0 };
    }
    const changeSets = await ctx.db
      .query('changeSets')
      .withIndex('by_teamRunId', (index) => index.eq('teamRunId', run._id))
      .collect();
    const workerSets = changeSets.filter(
      (changeSet) => changeSet.jobId && changeSet.state === 'applied',
    );
    const entries = (
      await Promise.all(
        workerSets.map((changeSet) =>
          ctx.db
            .query('changeEntries')
            .withIndex('by_changeSetId_and_sequence', (index) =>
              index.eq('changeSetId', changeSet._id),
            )
            .collect(),
        ),
      )
    )
      .flat()
      .reverse();
    const now = Date.now();
    const source = args.source ?? 'ui';
    const undoChangeSetId = await ctx.db.insert('changeSets', {
      workspaceId: run.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      teamRunId: run._id,
      source: 'undo',
      idempotencyKey: `undo-run:${run._id}`,
      summary: 'Conflict-aware Team Run undo',
      state: 'applied',
      createdAt: now,
    });
    let reverted = 0;
    let skippedConflicts = 0;
    for (const entry of entries) {
      if (entry.targetKind === 'object' || entry.targetKind === 'body') {
        const object = await ctx.db.get(entry.targetId as Id<'canvasObjects'>);
        if (!object || currentRevision(object, entry.segment) !== entry.postRevision) {
          skippedConflicts += 1;
          continue;
        }
        const nextRevision = entry.postRevision + 1;
        if (entry.segment === 'lifecycle') {
          const before = entry.beforeValue as { isDeleted?: boolean } | null;
          if (before?.isDeleted ?? true) {
            await assertCanvasObjectCanBeDeleted(ctx, object);
          }
          await ctx.db.patch(object._id, {
            isDeleted: before?.isDeleted ?? true,
            hierarchyRevision: nextRevision,
            updatedAt: now,
          });
        } else if (entry.segment === 'geometry') {
          const before = entry.beforeValue as Rectangle;
          await ctx.db.patch(object._id, {
            ...before,
            geometryRevision: nextRevision,
            updatedAt: now,
          });
        } else if (entry.segment === 'content') {
          const snapshot = parseContentSnapshot(entry.beforeValue);
          const previousBody = snapshot?.body ?? entry.beforeValue;
          const body = await ctx.db
            .query('canvasObjectBodies')
            .withIndex('by_workspaceId_and_objectId', (index) =>
              index.eq('workspaceId', run.workspaceId).eq('objectId', object._id),
            )
            .unique();
          if (body)
            await ctx.db.patch(body._id, {
              body: previousBody,
              revision: nextRevision,
              updatedAt: now,
            });
          else if (snapshot)
            await ctx.db.insert('canvasObjectBodies', {
              workspaceId: run.workspaceId,
              objectId: object._id,
              body: previousBody,
              revision: nextRevision,
              updatedAt: now,
            });
          await ctx.db.patch(object._id, {
            ...(snapshot ? { title: snapshot.title } : {}),
            contentPreview: createContentPreview(previousBody),
            contentRevision: nextRevision,
            updatedAt: now,
          });
        } else if (entry.segment === 'style') {
          await ctx.db.patch(object._id, {
            style: entry.beforeValue,
            styleRevision: nextRevision,
            updatedAt: now,
          });
        } else if (entry.segment === 'semantics') {
          await ctx.db.patch(object._id, {
            semantics: entry.beforeValue as Doc<'canvasObjects'>['semantics'],
            semanticsRevision: nextRevision,
            updatedAt: now,
          });
        } else {
          const before = entry.beforeValue as {
            parentId?: Id<'canvasObjects'>;
            orderKey?: string;
            locked?: boolean;
          };
          await ctx.db.patch(object._id, {
            ...before,
            hierarchyRevision: nextRevision,
            updatedAt: now,
          });
        }
        await ctx.db.insert('changeEntries', {
          workspaceId: run.workspaceId,
          changeSetId: undoChangeSetId,
          targetKind: entry.targetKind,
          targetId: entry.targetId,
          segment: entry.segment,
          beforeValue: entry.afterValue,
          afterValue: entry.beforeValue,
          postRevision: nextRevision,
          sequence: reverted,
          createdAt: now,
        });
        reverted += 1;
      } else if (entry.targetKind === 'edge') {
        const edge = await ctx.db.get(entry.targetId as Id<'canvasEdges'>);
        if (!edge || edge.revision !== entry.postRevision) {
          skippedConflicts += 1;
          continue;
        }
        const nextRevision = edge.revision + 1;
        if (entry.segment === 'lifecycle') {
          const before = entry.beforeValue as { isDeleted?: boolean } | null;
          await ctx.db.patch(edge._id, {
            isDeleted: before?.isDeleted ?? true,
            revision: nextRevision,
            updatedAt: now,
          });
        } else {
          const before = entry.beforeValue as Partial<Doc<'canvasEdges'>>;
          await ctx.db.patch(edge._id, { ...before, revision: nextRevision, updatedAt: now });
        }
        reverted += 1;
      }
    }
    for (const changeSet of workerSets) {
      await ctx.db.patch(changeSet._id, {
        state: skippedConflicts > 0 ? 'partially_undone' : 'undone',
      });
    }
    await ctx.db.patch(run._id, { undoneAt: now, updatedAt: now });
    await ctx.db.insert('activityEvents', {
      workspaceId: run.workspaceId,
      actorKind: source === 'webmcp' ? 'webmcp' : 'human',
      actorUserId: user._id,
      source: 'undo',
      eventType: 'team_run_undone',
      summary: `Undid ${reverted} change${reverted === 1 ? '' : 's'}; skipped ${skippedConflicts} conflict${skippedConflicts === 1 ? '' : 's'}`,
      changeSetId: undoChangeSetId,
      teamRunId: run._id,
      createdAt: now,
    });
    return { changeSetId: undoChangeSetId, reverted, skippedConflicts };
  },
});

export const reconcile = mutation({
  args: { teamRunId: v.id('teamRuns') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.teamRunId);
    if (!run) throw new Error('run_not_found');
    await requireWorkspaceMember(ctx, run.workspaceId, 'editor');
    await reconcileTeamRun(ctx, run._id);
    return null;
  },
});

type Rectangle = { x: number; y: number; width: number; height: number };
