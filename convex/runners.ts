import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import { requireCurrentUser, requireWorkspaceMember } from './lib/auth';
import { randomToken, randomUserCode, sha256 } from './lib/crypto';
import { reconcileTeamRun, releaseJobAuthority, updateDependentJobs } from './lib/jobLifecycle';
import { boundedText, hierarchyPathsConflict, limits, runnerFreeCapacity } from './lib/policies';
import { requireRunner, requireWorkerAuthorization } from './lib/runnerAuth';
import { engineReportValidator, workerAuthorizationValidator } from './validators';

const PAIRING_TTL_MS = 10 * 60_000;
const RUNNER_TOKEN_TTL_MS = 90 * 24 * 60 * 60_000;
const LEASE_TTL_MS = 15_000;
const CAPABILITY_TTL_MS = 20 * 60_000;

const activeAssignmentValidator = v.object({
  jobId: v.id('jobs'),
  attempt: v.number(),
  fencingToken: v.number(),
});

const progressValidator = v.object({
  jobId: v.id('jobs'),
  attempt: v.number(),
  fencingToken: v.number(),
  sequence: v.number(),
  phase: v.string(),
  message: v.string(),
  targetObjectId: v.optional(v.id('canvasObjects')),
});

async function validProgressTarget(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  claimTargetId: Id<'canvasObjects'>,
  targetObjectId?: Id<'canvasObjects'>,
): Promise<boolean> {
  if (!targetObjectId) return true;
  const object = await ctx.db.get(targetObjectId);
  return Boolean(
    object &&
    !object.isDeleted &&
    object.workspaceId === workspaceId &&
    (object._id === claimTargetId || object.hierarchyPath.includes(claimTargetId)),
  );
}

async function expireRunnerLeases(ctx: MutationCtx, runner: Doc<'runners'>): Promise<void> {
  const now = Date.now();
  const leases = await ctx.db
    .query('runnerLeases')
    .withIndex('by_runnerId_and_status', (index) =>
      index.eq('runnerId', runner._id).eq('status', 'active'),
    )
    .take(100);
  for (const lease of leases) {
    if (lease.expiresAt > now) continue;
    const job = await ctx.db.get(lease.jobId);
    await ctx.db.patch(lease._id, { status: 'expired', updatedAt: now });
    const claim = await ctx.db
      .query('workClaims')
      .withIndex('by_jobId_and_status', (index) =>
        index.eq('jobId', lease.jobId).eq('status', 'active'),
      )
      .unique();
    if (claim) await ctx.db.patch(claim._id, { status: 'expired', updatedAt: now });
    const capabilities = await ctx.db
      .query('jobCapabilities')
      .withIndex('by_jobId_and_attempt', (index) =>
        index.eq('jobId', lease.jobId).eq('attempt', lease.attempt),
      )
      .take(10);
    for (const capability of capabilities) {
      if (!capability.revokedAt) await ctx.db.patch(capability._id, { revokedAt: now });
    }
    if (
      job &&
      job.runnerId === runner._id &&
      job.attempt === lease.attempt &&
      job.fencingToken === lease.fencingToken &&
      (job.state === 'leased' || job.state === 'running')
    ) {
      await ctx.db.patch(job._id, {
        state: 'queued',
        runnerId: undefined,
        progressMessage: 'Runner lease expired; safely requeued',
        updatedAt: now,
      });
    }
  }
}

async function hasClaimConflict(ctx: MutationCtx, job: Doc<'jobs'>): Promise<boolean> {
  const now = Date.now();
  const claims = await ctx.db
    .query('workClaims')
    .withIndex('by_workspaceId_and_status', (index) =>
      index.eq('workspaceId', job.workspaceId).eq('status', 'active'),
    )
    .take(limits.claimsPerWorkspace);
  for (const claim of claims) {
    if (claim.expiresAt <= now) {
      await ctx.db.patch(claim._id, { status: 'expired', updatedAt: now });
      continue;
    }
    if (
      hierarchyPathsConflict(
        job.targetSectionId,
        job.hierarchyPath,
        claim.targetObjectId,
        claim.hierarchyPath,
      )
    ) {
      return true;
    }
  }
  return false;
}

async function claimNextJob(
  ctx: MutationCtx,
  runner: Doc<'runners'>,
): Promise<{
  job: Doc<'jobs'>;
  role: Doc<'roleProfiles'>;
  capabilityToken: string;
  capabilityExpiresAt: number;
  leaseExpiresAt: number;
  attempt: number;
  fencingToken: number;
} | null> {
  const readyEngines = runner.engines
    .filter((engine) => engine.authState === 'ready')
    .map((engine) => engine.engine);
  for (const workspaceId of runner.allowedWorkspaceIds) {
    for (const engine of readyEngines) {
      const candidates = await ctx.db
        .query('jobs')
        .withIndex('by_workspaceId_and_engine_and_state', (index) =>
          index.eq('workspaceId', workspaceId).eq('engine', engine).eq('state', 'queued'),
        )
        .take(limits.jobsPerRun);
      for (const job of candidates) {
        const run = await ctx.db.get(job.teamRunId);
        if (!run || run.state !== 'active' || (await hasClaimConflict(ctx, job))) continue;
        const reservation = await ctx.db
          .query('canvasReservations')
          .withIndex('by_jobId', (index) => index.eq('jobId', job._id))
          .unique();
        if (!reservation || reservation.status !== 'reserved') continue;
        const role = await ctx.db.get(job.roleProfileId);
        if (!role) continue;
        const now = Date.now();
        const attempt = job.attempt + 1;
        const fencingToken = job.fencingToken + 1;
        const leaseExpiresAt = now + LEASE_TTL_MS;
        const capabilityExpiresAt = now + CAPABILITY_TTL_MS;
        const capabilityToken = randomToken();
        await ctx.db.insert('runnerLeases', {
          workspaceId,
          jobId: job._id,
          runnerId: runner._id,
          attempt,
          fencingToken,
          status: 'active',
          expiresAt: leaseExpiresAt,
          createdAt: now,
          updatedAt: now,
        });
        await ctx.db.insert('workClaims', {
          workspaceId,
          jobId: job._id,
          runnerId: runner._id,
          targetObjectId: job.targetSectionId,
          hierarchyPath: job.hierarchyPath,
          attempt,
          fencingToken,
          status: 'active',
          expiresAt: leaseExpiresAt,
          createdAt: now,
          updatedAt: now,
        });
        await ctx.db.insert('jobCapabilities', {
          workspaceId,
          jobId: job._id,
          runnerId: runner._id,
          attempt,
          fencingToken,
          tokenHash: await sha256(capabilityToken),
          targetObjectId: job.targetSectionId,
          expiresAt: capabilityExpiresAt,
          createdAt: now,
        });
        await ctx.db.patch(job._id, {
          state: 'leased',
          runnerId: runner._id,
          attempt,
          fencingToken,
          progressMessage: 'Assignment leased to Guild Runner',
          updatedAt: now,
        });
        return {
          job: { ...job, state: 'leased', runnerId: runner._id, attempt, fencingToken },
          role,
          capabilityToken,
          capabilityExpiresAt,
          leaseExpiresAt,
          attempt,
          fencingToken,
        };
      }
    }
  }
  return null;
}

export const beginPairing = mutation({
  args: {
    runnerName: v.string(),
    configuredConcurrency: v.number(),
    engines: v.array(engineReportValidator),
  },
  returns: v.object({
    pairingId: v.id('runnerPairings'),
    deviceCode: v.string(),
    userCode: v.string(),
    expiresAt: v.number(),
    intervalSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    const runnerName = args.runnerName.trim();
    if (!runnerName || runnerName.length > 100) throw new Error('invalid_runner_name');
    if (
      !Number.isInteger(args.configuredConcurrency) ||
      args.configuredConcurrency < 1 ||
      args.configuredConcurrency > 16
    ) {
      throw new Error('invalid_runner_concurrency');
    }
    const deviceCode = randomToken();
    const userCode = randomUserCode();
    const now = Date.now();
    const expiresAt = now + PAIRING_TTL_MS;
    const pairingId = await ctx.db.insert('runnerPairings', {
      deviceCodeHash: await sha256(deviceCode),
      userCode,
      runnerName,
      engines: args.engines,
      configuredConcurrency: args.configuredConcurrency,
      state: 'pending',
      allowedWorkspaceIds: [],
      expiresAt,
      createdAt: now,
    });
    return { pairingId, deviceCode, userCode, expiresAt, intervalSeconds: 3 };
  },
});

export const approvePairing = mutation({
  args: { userCode: v.string(), allowedWorkspaceIds: v.array(v.id('workspaces')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const pairing = await ctx.db
      .query('runnerPairings')
      .withIndex('by_userCode', (index) => index.eq('userCode', args.userCode.trim().toUpperCase()))
      .unique();
    if (!pairing || pairing.state !== 'pending' || pairing.expiresAt <= Date.now()) {
      throw new Error('pairing_not_available');
    }
    const allowedWorkspaceIds = [...new Set(args.allowedWorkspaceIds)];
    if (allowedWorkspaceIds.length < 1 || allowedWorkspaceIds.length > 100) {
      throw new Error('invalid_workspace_grant');
    }
    for (const workspaceId of allowedWorkspaceIds) {
      const membership = await ctx.db
        .query('workspaceMembers')
        .withIndex('by_workspaceId_and_userId', (index) =>
          index.eq('workspaceId', workspaceId).eq('userId', user._id),
        )
        .unique();
      if (!membership || membership.role === 'viewer') throw new Error('forbidden_workspace_grant');
    }
    await ctx.db.patch(pairing._id, {
      ownerUserId: user._id,
      allowedWorkspaceIds,
      state: 'approved',
      approvedAt: Date.now(),
    });
    return null;
  },
});

export const exchangePairing = mutation({
  args: { pairingId: v.id('runnerPairings'), deviceCode: v.string() },
  returns: v.union(v.null(), v.object({ runnerId: v.id('runners'), runnerToken: v.string() })),
  handler: async (ctx, args) => {
    const pairing = await ctx.db.get(args.pairingId);
    if (!pairing || pairing.deviceCodeHash !== (await sha256(args.deviceCode))) {
      throw new Error('invalid_device_code');
    }
    if (pairing.expiresAt <= Date.now()) {
      if (pairing.state !== 'expired') await ctx.db.patch(pairing._id, { state: 'expired' });
      throw new Error('pairing_expired');
    }
    if (pairing.state === 'pending') return null;
    if (pairing.state !== 'approved' || !pairing.ownerUserId) {
      throw new Error('pairing_already_exchanged');
    }
    const runnerToken = randomToken();
    const now = Date.now();
    const runnerId = await ctx.db.insert('runners', {
      ownerUserId: pairing.ownerUserId,
      name: pairing.runnerName,
      tokenHash: await sha256(runnerToken),
      allowedWorkspaceIds: pairing.allowedWorkspaceIds,
      engines: pairing.engines,
      status: 'offline',
      configuredConcurrency: pairing.configuredConcurrency,
      activeJobCount: 0,
      lastHeartbeatAt: now,
      tokenExpiresAt: now + RUNNER_TOKEN_TTL_MS,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(pairing._id, { state: 'exchanged', exchangedAt: now });
    return { runnerId, runnerToken };
  },
});

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query('runners')
      .withIndex('by_ownerUserId_and_status', (index) => index.eq('ownerUserId', user._id))
      .take(100);
  },
});

export const getStatus = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const runners = (
      await Promise.all(
        (['online', 'busy', 'auth_needed', 'offline'] as const).map((status) =>
          ctx.db
            .query('runners')
            .withIndex('by_status_and_lastHeartbeatAt', (index) => index.eq('status', status))
            .take(100),
        ),
      )
    ).flat();
    return runners.filter((runner) => runner.allowedWorkspaceIds.includes(args.workspaceId));
  },
});

export const rename = mutation({
  args: { runnerId: v.id('runners'), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const runner = await ctx.db.get(args.runnerId);
    if (!runner) throw new Error('runner_not_found');
    const user = await requireCurrentUser(ctx);
    if (runner.ownerUserId !== user._id) throw new Error('forbidden');
    const name = args.name.trim();
    if (!name || name.length > 100) throw new Error('invalid_runner_name');
    await ctx.db.patch(runner._id, { name, updatedAt: Date.now() });
    return null;
  },
});

export const revoke = mutation({
  args: { runnerId: v.id('runners') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const runner = await ctx.db.get(args.runnerId);
    if (!runner) throw new Error('runner_not_found');
    const user = await requireCurrentUser(ctx);
    if (runner.ownerUserId !== user._id) throw new Error('forbidden');
    if (runner.status === 'revoked') return null;
    const now = Date.now();
    const leases = await ctx.db
      .query('runnerLeases')
      .withIndex('by_runnerId_and_status', (index) =>
        index.eq('runnerId', runner._id).eq('status', 'active'),
      )
      .take(100);
    for (const lease of leases) {
      const job = await ctx.db.get(lease.jobId);
      if (job && (job.state === 'leased' || job.state === 'running')) {
        await releaseJobAuthority(ctx, job, 'released');
        const reservation = await ctx.db
          .query('canvasReservations')
          .withIndex('by_jobId', (index) => index.eq('jobId', job._id))
          .unique();
        if (reservation)
          await ctx.db.patch(reservation._id, { status: 'reserved', updatedAt: now });
        await ctx.db.patch(job._id, {
          state: 'queued',
          runnerId: undefined,
          progressMessage: 'Runner revoked; safely requeued',
          updatedAt: now,
        });
      }
    }
    await ctx.db.patch(runner._id, { status: 'revoked', revokedAt: now, updatedAt: now });
    return null;
  },
});

export const heartbeat = mutation({
  args: {
    runnerToken: v.string(),
    configuredConcurrency: v.number(),
    engines: v.array(engineReportValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const runner = await requireRunner(ctx, args.runnerToken);
    if (
      !Number.isInteger(args.configuredConcurrency) ||
      args.configuredConcurrency < 1 ||
      args.configuredConcurrency > 16
    ) {
      throw new Error('invalid_runner_concurrency');
    }
    const status = args.engines.some((engine) => engine.authState === 'ready')
      ? runner.activeJobCount > 0
        ? 'busy'
        : 'online'
      : 'auth_needed';
    await ctx.db.patch(runner._id, {
      engines: args.engines,
      configuredConcurrency: args.configuredConcurrency,
      status,
      lastHeartbeatAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const poll = mutation({
  args: {
    runnerToken: v.string(),
    configuredConcurrency: v.number(),
    freeCapacity: v.number(),
    engines: v.array(engineReportValidator),
    activeAssignments: v.array(activeAssignmentValidator),
    progress: v.array(progressValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let runner = await requireRunner(ctx, args.runnerToken);
    await expireRunnerLeases(ctx, runner);
    const now = Date.now();
    const concurrency = Math.max(1, Math.min(16, Math.floor(args.configuredConcurrency)));
    const ready = args.engines.some((engine) => engine.authState === 'ready');
    await ctx.db.patch(runner._id, {
      engines: args.engines,
      configuredConcurrency: concurrency,
      status: ready ? (runner.activeJobCount > 0 ? 'busy' : 'online') : 'auth_needed',
      lastHeartbeatAt: now,
      updatedAt: now,
    });
    runner = {
      ...runner,
      engines: args.engines,
      configuredConcurrency: concurrency,
      lastHeartbeatAt: now,
    };

    const leaseRenewals: Array<{
      jobId: Id<'jobs'>;
      attempt: number;
      fencingToken: number;
      leaseExpiresAt: number;
    }> = [];
    const cancellations: Array<{
      jobId: Id<'jobs'>;
      attempt: number;
      fencingToken: number;
      reason: string;
    }> = [];
    for (const assignment of args.activeAssignments.slice(0, 64)) {
      const job = await ctx.db.get(assignment.jobId);
      if (
        !job ||
        job.runnerId !== runner._id ||
        job.attempt !== assignment.attempt ||
        job.fencingToken !== assignment.fencingToken ||
        (job.state !== 'leased' && job.state !== 'running')
      ) {
        cancellations.push({ ...assignment, reason: 'Assignment cancelled or superseded' });
        continue;
      }
      const lease = await ctx.db
        .query('runnerLeases')
        .withIndex('by_jobId_and_status', (index) =>
          index.eq('jobId', job._id).eq('status', 'active'),
        )
        .unique();
      const claim = await ctx.db
        .query('workClaims')
        .withIndex('by_jobId_and_status', (index) =>
          index.eq('jobId', job._id).eq('status', 'active'),
        )
        .unique();
      if (!lease || !claim) {
        cancellations.push({ ...assignment, reason: 'Assignment authority expired' });
        continue;
      }
      const expiresAt = now + LEASE_TTL_MS;
      await ctx.db.patch(lease._id, { expiresAt, updatedAt: now });
      await ctx.db.patch(claim._id, { expiresAt, updatedAt: now });
      leaseRenewals.push({ ...assignment, leaseExpiresAt: expiresAt });
    }

    for (const progress of args.progress.slice(0, 100)) {
      const job = await ctx.db.get(progress.jobId);
      if (
        !job ||
        job.runnerId !== runner._id ||
        job.attempt !== progress.attempt ||
        job.fencingToken !== progress.fencingToken ||
        (job.state !== 'leased' && job.state !== 'running')
      )
        continue;
      const claim = await ctx.db
        .query('workClaims')
        .withIndex('by_jobId_and_status', (index) =>
          index.eq('jobId', job._id).eq('status', 'active'),
        )
        .unique();
      if (
        !claim ||
        !(await validProgressTarget(
          ctx,
          job.workspaceId,
          claim.targetObjectId,
          progress.targetObjectId,
        ))
      ) {
        continue;
      }
      const duplicate = await ctx.db
        .query('workerSteps')
        .withIndex('by_jobId_and_attempt_and_sequence', (index) =>
          index
            .eq('jobId', job._id)
            .eq('attempt', progress.attempt)
            .eq('sequence', progress.sequence),
        )
        .unique();
      if (duplicate) continue;
      const message = boundedText(progress.message.trim() || progress.phase, 2_000);
      await ctx.db.insert('workerSteps', {
        workspaceId: job.workspaceId,
        teamRunId: job.teamRunId,
        jobId: job._id,
        runnerId: runner._id,
        roleProfileId: job.roleProfileId,
        engine: job.engine,
        attempt: job.attempt,
        fencingToken: job.fencingToken,
        sequence: progress.sequence,
        phase: boundedText(progress.phase, 80),
        ...(progress.targetObjectId ? { targetObjectId: progress.targetObjectId } : {}),
        progressMessage: message,
        startedAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(job._id, {
        state: 'running',
        progressMessage: message,
        startedAt: job.startedAt ?? now,
        updatedAt: now,
      });
    }

    const assignments = [];
    const activeCount = args.activeAssignments.length;
    const requestedCapacity = Math.max(
      0,
      Math.min(args.freeCapacity, runnerFreeCapacity(concurrency, activeCount)),
    );
    for (let index = 0; index < requestedCapacity; index += 1) {
      const claimed = await claimNextJob(ctx, runner);
      if (!claimed) break;
      assignments.push({
        jobId: claimed.job._id,
        runId: claimed.job.teamRunId,
        workspaceId: claimed.job.workspaceId,
        roleProfileId: claimed.role._id,
        roleName: claimed.role.name,
        roleInstructions: claimed.job.roleInstructions,
        brief: claimed.job.brief,
        engine: claimed.job.engine,
        attempt: claimed.attempt,
        fencingToken: claimed.fencingToken,
        assignmentToken: claimed.capabilityToken,
        assignmentExpiresAt: claimed.capabilityExpiresAt,
        leaseExpiresAt: claimed.leaseExpiresAt,
        expectedArtifactTypes: claimed.job.expectedArtifactTypes,
      });
    }
    const nextActiveCount = activeCount + assignments.length;
    await ctx.db.patch(runner._id, {
      activeJobCount: nextActiveCount,
      status: ready ? (nextActiveCount > 0 ? 'busy' : 'online') : 'auth_needed',
      updatedAt: now,
    });
    const activeRuns = await Promise.all(
      runner.allowedWorkspaceIds.map((workspaceId) =>
        ctx.db
          .query('teamRuns')
          .withIndex('by_workspaceId_and_state', (index) =>
            index.eq('workspaceId', workspaceId).eq('state', 'active'),
          )
          .first(),
      ),
    );
    return {
      serverTime: now,
      activeRun: activeRuns.some(Boolean),
      assignments,
      cancellations,
      leaseRenewals,
      retryAfterMs: activeRuns.some(Boolean) ? 2_000 : 10_000,
    };
  },
});

export const reportProgress = mutation({
  args: {
    workerAuthorization: workerAuthorizationValidator,
    phase: v.string(),
    message: v.string(),
    sequence: v.number(),
    targetObjectId: v.optional(v.id('canvasObjects')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const worker = await requireWorkerAuthorization(ctx, args.workerAuthorization);
    if (
      !(await validProgressTarget(
        ctx,
        worker.job.workspaceId,
        worker.claim.targetObjectId,
        args.targetObjectId,
      ))
    ) {
      throw new Error('outside_work_claim');
    }
    const duplicate = await ctx.db
      .query('workerSteps')
      .withIndex('by_jobId_and_attempt_and_sequence', (index) =>
        index
          .eq('jobId', worker.job._id)
          .eq('attempt', worker.job.attempt)
          .eq('sequence', args.sequence),
      )
      .unique();
    if (duplicate) return null;
    const now = Date.now();
    const message = boundedText(args.message.trim() || args.phase, 2_000);
    await ctx.db.insert('workerSteps', {
      workspaceId: worker.job.workspaceId,
      teamRunId: worker.job.teamRunId,
      jobId: worker.job._id,
      runnerId: worker.runner._id,
      roleProfileId: worker.job.roleProfileId,
      engine: worker.job.engine,
      attempt: worker.job.attempt,
      fencingToken: worker.job.fencingToken,
      sequence: args.sequence,
      phase: boundedText(args.phase, 80),
      ...(args.targetObjectId ? { targetObjectId: args.targetObjectId } : {}),
      progressMessage: message,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(worker.job._id, {
      state: 'running',
      progressMessage: message,
      startedAt: worker.job.startedAt ?? now,
      updatedAt: now,
    });
    return null;
  },
});

export const complete = mutation({
  args: {
    workerAuthorization: workerAuthorizationValidator,
    state: v.union(v.literal('completed'), v.literal('failed'), v.literal('cancelled')),
    finalMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const worker = await requireWorkerAuthorization(ctx, args.workerAuthorization);
    const now = Date.now();
    const message = boundedText(
      args.finalMessage?.trim() ||
        (args.state === 'completed' ? 'Worker completed assignment' : 'Worker assignment ended'),
      2_000,
    );
    await releaseJobAuthority(
      ctx,
      worker.job,
      args.state === 'completed' ? 'completed' : 'released',
    );
    await ctx.db.patch(worker.job._id, {
      state: args.state,
      progressMessage: message,
      ...(args.state === 'failed'
        ? { errorMessage: boundedText(args.errorMessage?.trim() || message, 2_000) }
        : {}),
      completedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('comments', {
      workspaceId: worker.job.workspaceId,
      targetType: 'object',
      objectId: worker.job.targetSectionId,
      authorKind: 'worker',
      authorUserId: worker.runner.ownerUserId,
      authorRoleProfileId: worker.job.roleProfileId,
      body: message,
      mentionedRoleProfileIds: [],
      state: args.state === 'completed' ? 'completed' : args.state === 'failed' ? 'failed' : 'open',
      revision: 0,
      teamRunId: worker.job.teamRunId,
      jobIds: [worker.job._id],
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('activityEvents', {
      workspaceId: worker.job.workspaceId,
      actorKind: 'worker',
      actorUserId: worker.runner.ownerUserId,
      actorRoleProfileId: worker.job.roleProfileId,
      source: 'worker',
      eventType: `job_${args.state}`,
      summary: message,
      targetId: worker.job.targetSectionId,
      teamRunId: worker.job.teamRunId,
      jobId: worker.job._id,
      createdAt: now,
    });
    await updateDependentJobs(ctx, { ...worker.job, state: args.state });
    await reconcileTeamRun(ctx, worker.job.teamRunId);
    return null;
  },
});

export const expireStale = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const leases = await ctx.db
      .query('runnerLeases')
      .withIndex('by_status_and_expiresAt', (index) =>
        index.eq('status', 'active').lt('expiresAt', now),
      )
      .take(100);
    for (const lease of leases) {
      const runner = await ctx.db.get(lease.runnerId);
      if (runner) await expireRunnerLeases(ctx, runner);
    }
    return null;
  },
});
