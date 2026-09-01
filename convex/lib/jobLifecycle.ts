import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { deriveDependencyState, limits } from './policies';

export async function releaseJobAuthority(
  ctx: MutationCtx,
  job: Doc<'jobs'>,
  reservationStatus: 'completed' | 'released',
): Promise<void> {
  const now = Date.now();
  const [lease, claim, capabilities, reservation] = await Promise.all([
    ctx.db
      .query('runnerLeases')
      .withIndex('by_jobId_and_status', (query) =>
        query.eq('jobId', job._id).eq('status', 'active'),
      )
      .unique(),
    ctx.db
      .query('workClaims')
      .withIndex('by_jobId_and_status', (query) =>
        query.eq('jobId', job._id).eq('status', 'active'),
      )
      .unique(),
    ctx.db
      .query('jobCapabilities')
      .withIndex('by_jobId_and_attempt', (query) =>
        query.eq('jobId', job._id).eq('attempt', job.attempt),
      )
      .take(10),
    ctx.db
      .query('canvasReservations')
      .withIndex('by_jobId', (query) => query.eq('jobId', job._id))
      .unique(),
  ]);
  if (lease) await ctx.db.patch(lease._id, { status: 'released', updatedAt: now });
  if (claim) await ctx.db.patch(claim._id, { status: 'released', updatedAt: now });
  for (const capability of capabilities) {
    if (!capability.revokedAt) await ctx.db.patch(capability._id, { revokedAt: now });
  }
  if (reservation) {
    await ctx.db.patch(reservation._id, { status: reservationStatus, updatedAt: now });
  }
  if (job.runnerId) {
    const runner = await ctx.db.get(job.runnerId);
    if (runner) {
      const activeJobCount = Math.max(0, runner.activeJobCount - 1);
      await ctx.db.patch(runner._id, {
        activeJobCount,
        status: activeJobCount > 0 ? 'busy' : 'online',
        updatedAt: now,
      });
    }
  }
}

export async function updateDependentJobs(
  ctx: MutationCtx,
  completedJob: Doc<'jobs'>,
): Promise<void> {
  const jobs = await ctx.db
    .query('jobs')
    .withIndex('by_teamRunId', (query) => query.eq('teamRunId', completedJob.teamRunId))
    .take(limits.jobsPerRun);
  for (const candidate of jobs) {
    if (
      candidate.state !== 'blocked_by_dependency' ||
      !candidate.dependencyJobIds.includes(completedJob._id)
    ) {
      continue;
    }
    const dependencies = await Promise.all(candidate.dependencyJobIds.map((id) => ctx.db.get(id)));
    const dependencyState = deriveDependencyState(
      dependencies.map((dependency) => dependency?.state ?? 'cancelled'),
    );
    await ctx.db.patch(candidate._id, {
      state:
        dependencyState === 'queued'
          ? 'queued'
          : dependencyState === 'cancelled_by_dependency'
            ? 'cancelled'
            : 'blocked_by_dependency',
      ...(dependencyState === 'cancelled_by_dependency'
        ? { errorMessage: 'Cancelled because a dependency did not complete' }
        : {}),
      updatedAt: Date.now(),
    });
  }
}

export async function reconcileTeamRun(ctx: MutationCtx, teamRunId: Id<'teamRuns'>): Promise<void> {
  const run = await ctx.db.get(teamRunId);
  if (!run || run.state !== 'active') return;
  const jobs = await ctx.db
    .query('jobs')
    .withIndex('by_teamRunId', (query) => query.eq('teamRunId', teamRunId))
    .take(limits.jobsPerRun);
  if (jobs.some((job) => !['completed', 'failed', 'cancelled'].includes(job.state))) return;
  const now = Date.now();
  const state = jobs.some((job) => job.state === 'failed')
    ? 'failed'
    : jobs.every((job) => job.state === 'cancelled')
      ? 'cancelled'
      : 'completed';
  await ctx.db.patch(run._id, {
    state,
    ...(state === 'completed' ? { completedAt: now } : {}),
    ...(state === 'cancelled' ? { stoppedAt: now } : {}),
    updatedAt: now,
  });
}
