// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const ownerIdentity = {
  subject: 'workos_runner_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_runner_owner',
  name: 'Runner Owner',
};

const readyEngines = [
  { engine: 'codex' as const, version: 'test-codex', authState: 'ready' as const },
  { engine: 'claude' as const, version: 'test-claude', authState: 'ready' as const },
];

async function setupRunnerAssignment() {
  const t = convexTest(schema, modules);
  const asOwner = t.withIdentity(ownerIdentity);
  const workspaceId = await asOwner.mutation(api.workspaces.create, {
    title: 'Runner integration workspace',
  });
  const roleProfileId = await asOwner.mutation(api.roleProfiles.create, {
    workspaceId,
    handle: 'builder',
    name: 'Builder',
    responsibility: 'Build canvas artifacts.',
    instructions: 'Create visible output inside the assigned target.',
    engine: 'codex',
    capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
    expectedArtifactTypes: ['sticky', 'text', 'task'],
    staticDependencyRoleProfileIds: [],
    color: '#2563eb',
  });
  const role = await t.run(async (ctx) => ctx.db.get(roleProfileId));
  if (!role) throw new Error('role_not_created');
  const run = await asOwner.mutation(api.runs.assign, {
    workspaceId,
    roleProfileId,
    targetObjectId: role.ownedSectionId,
    brief: 'Create one reviewed implementation artifact.',
    idempotencyKey: 'runner:assignment:integration:0001',
    source: 'ui',
  });
  const pairing = await t.mutation(api.runners.beginPairing, {
    runnerName: 'Integration Runner',
    configuredConcurrency: 2,
    engines: readyEngines,
  });
  expect(
    await t.mutation(api.runners.exchangePairing, {
      pairingId: pairing.pairingId,
      deviceCode: pairing.deviceCode,
    }),
  ).toBeNull();
  await asOwner.mutation(api.runners.approvePairing, {
    userCode: pairing.userCode.toLowerCase(),
    allowedWorkspaceIds: [workspaceId],
  });
  const exchanged = await t.mutation(api.runners.exchangePairing, {
    pairingId: pairing.pairingId,
    deviceCode: pairing.deviceCode,
  });
  if (!exchanged) throw new Error('runner_not_exchanged');
  return { t, asOwner, workspaceId, roleProfileId, run, ...exchanged };
}

describe('Convex Runner integration', () => {
  it('never exposes Runner token hashes through human-facing queries', async () => {
    const { asOwner, workspaceId } = await setupRunnerAssignment();

    const ownedRunners = await asOwner.query(api.runners.list, {});
    const workspaceRunners = await asOwner.query(api.runners.getStatus, { workspaceId });

    expect(ownedRunners).toHaveLength(1);
    expect(workspaceRunners).toHaveLength(1);
    expect(ownedRunners[0]).not.toHaveProperty('tokenHash');
    expect(workspaceRunners[0]).not.toHaveProperty('tokenHash');
  });

  it('pairs, claims, writes, reports, completes, rejects stale authority, and revokes', async () => {
    const { t, asOwner, workspaceId, run, runnerId, runnerToken } = await setupRunnerAssignment();
    const polled = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 2,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    expect(polled.assignments).toHaveLength(1);
    const assignment = polled.assignments[0]!;
    expect(assignment).toMatchObject({ jobId: run.jobId, attempt: 1, fencingToken: 1 });
    const renewed = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 0,
      engines: readyEngines,
      activeAssignments: [
        {
          jobId: assignment.jobId,
          attempt: assignment.attempt,
          fencingToken: assignment.fencingToken,
        },
      ],
      progress: [],
    });
    expect(renewed.leaseRenewals).toEqual([
      expect.objectContaining({
        jobId: assignment.jobId,
        attempt: assignment.attempt,
        fencingToken: assignment.fencingToken,
      }),
    ]);
    expect(renewed.leaseRenewals[0]!.leaseExpiresAt).toBeGreaterThanOrEqual(
      assignment.leaseExpiresAt,
    );
    const workerAuthorization = {
      runnerToken,
      capabilityToken: assignment.assignmentToken,
      jobId: assignment.jobId,
      attempt: assignment.attempt,
      fencingToken: assignment.fencingToken,
    };

    const workerChange = await t.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'worker',
      idempotencyKey: 'worker:create:integration:0001',
      summary: 'Worker created implementation artifact',
      workerAuthorization,
      commands: [
        {
          type: 'create_object',
          objectType: 'sticky',
          title: 'Implementation ready',
          content: { text: 'Reviewed by the local Worker.' },
          size: { width: 240, height: 160 },
          logicalKey: 'runner-integration-output',
        },
      ],
    });
    const createdObjectId = workerChange.changed[0]!.targetId;
    await t.mutation(api.runners.reportProgress, {
      workerAuthorization,
      phase: 'implementation',
      message: 'Created the reviewed artifact.',
      sequence: 1,
      targetObjectId: createdObjectId as never,
    });
    await t.mutation(api.runners.reportProgress, {
      workerAuthorization,
      phase: 'implementation',
      message: 'Duplicate progress should be ignored.',
      sequence: 1,
      targetObjectId: createdObjectId as never,
    });
    await t.mutation(api.runners.complete, {
      workerAuthorization,
      state: 'completed',
      finalMessage: 'Implementation artifact completed.',
    });

    const stored = await t.run(async (ctx) => {
      const job = await ctx.db.get(run.jobId);
      const teamRun = await ctx.db.get(run.runId);
      const lease = await ctx.db
        .query('runnerLeases')
        .withIndex('by_jobId_and_status', (query) =>
          query.eq('jobId', run.jobId).eq('status', 'released'),
        )
        .unique();
      const claim = await ctx.db
        .query('workClaims')
        .withIndex('by_jobId_and_status', (query) =>
          query.eq('jobId', run.jobId).eq('status', 'released'),
        )
        .unique();
      const reservation = await ctx.db
        .query('canvasReservations')
        .withIndex('by_jobId', (query) => query.eq('jobId', run.jobId))
        .unique();
      const steps = await ctx.db
        .query('workerSteps')
        .withIndex('by_jobId_and_attempt_and_sequence', (query) =>
          query.eq('jobId', run.jobId).eq('attempt', 1),
        )
        .collect();
      const comments = await ctx.db
        .query('comments')
        .withIndex('by_workspaceId_and_targetType', (query) => query.eq('workspaceId', workspaceId))
        .collect();
      const createdObject = await ctx.db.get(createdObjectId as never);
      return { job, teamRun, lease, claim, reservation, steps, comments, createdObject };
    });
    expect(stored.job).toMatchObject({ state: 'completed', attempt: 1, fencingToken: 1 });
    expect(stored.teamRun).toMatchObject({ state: 'completed' });
    expect(stored.lease).not.toBeNull();
    expect(stored.claim).not.toBeNull();
    expect(stored.reservation).toMatchObject({ status: 'completed' });
    expect(stored.createdObject).toMatchObject({
      parentId: expect.any(String),
      x: 48,
      y: 72,
    });
    expect(stored.steps).toHaveLength(1);
    expect(stored.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          authorKind: 'worker',
          state: 'completed',
          body: 'Implementation artifact completed.',
        }),
      ]),
    );
    await expect(
      t.mutation(api.runners.reportProgress, {
        workerAuthorization,
        phase: 'late',
        message: 'This stale write must fail.',
        sequence: 2,
      }),
    ).rejects.toThrow();

    const undo = await asOwner.mutation(api.runs.undo, { teamRunId: run.runId, source: 'ui' });
    expect(undo.reverted).toBeGreaterThan(0);
    const undoneObject = await t.run(async (ctx) => ctx.db.get(createdObjectId as never));
    expect(undoneObject).toMatchObject({ isDeleted: true });

    await asOwner.mutation(api.runners.revoke, { runnerId });
    await expect(
      t.mutation(api.runners.heartbeat, {
        runnerToken,
        configuredConcurrency: 2,
        engines: readyEngines,
      }),
    ).rejects.toThrow();
    expect(await asOwner.query(api.runners.getStatus, { workspaceId })).toEqual([]);
  });

  it('retries a failed Job, then stop rejects the superseded assignment', async () => {
    const { t, asOwner, run, runnerToken } = await setupRunnerAssignment();
    const firstPoll = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 1,
      freeCapacity: 1,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    const first = firstPoll.assignments[0]!;
    const firstAuthorization = {
      runnerToken,
      capabilityToken: first.assignmentToken,
      jobId: first.jobId,
      attempt: first.attempt,
      fencingToken: first.fencingToken,
    };
    await t.mutation(api.runners.complete, {
      workerAuthorization: firstAuthorization,
      state: 'failed',
      errorMessage: 'Intentional integration failure.',
    });
    await asOwner.mutation(api.runs.retryJob, { jobId: run.jobId, source: 'ui' });
    const secondPoll = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 1,
      freeCapacity: 1,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    const second = secondPoll.assignments[0]!;
    expect(second).toMatchObject({ jobId: run.jobId, attempt: 2, fencingToken: 2 });

    await asOwner.mutation(api.runs.stop, { teamRunId: run.runId, source: 'ui' });
    await expect(
      t.mutation(api.runners.reportProgress, {
        workerAuthorization: {
          runnerToken,
          capabilityToken: second.assignmentToken,
          jobId: second.jobId,
          attempt: second.attempt,
          fencingToken: second.fencingToken,
        },
        phase: 'late',
        message: 'Stopped assignment cannot write.',
        sequence: 1,
      }),
    ).rejects.toThrow();
    const cancellationPoll = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 1,
      freeCapacity: 0,
      engines: readyEngines,
      activeAssignments: [
        { jobId: second.jobId, attempt: second.attempt, fencingToken: second.fencingToken },
      ],
      progress: [],
    });
    expect(cancellationPoll.cancellations).toEqual([
      expect.objectContaining({
        jobId: second.jobId,
        reason: 'Assignment cancelled or superseded',
      }),
    ]);
  });

  it('never leases two Jobs whose Work Claims overlap the same canvas target', async () => {
    const { t, asOwner, workspaceId, roleProfileId, run, runnerToken } =
      await setupRunnerAssignment();
    const role = await t.run(async (ctx) => ctx.db.get(roleProfileId));
    if (!role) throw new Error('role_not_found');
    const overlappingRun = await asOwner.mutation(api.runs.assign, {
      workspaceId,
      roleProfileId,
      targetObjectId: role.ownedSectionId,
      brief: 'Attempt another assignment against the same reserved target.',
      idempotencyKey: 'runner:assignment:overlap:0001',
      source: 'ui',
    });

    const initial = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 2,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    expect(initial.assignments).toHaveLength(1);
    expect(initial.assignments[0]).toMatchObject({ jobId: run.jobId });
    const deferred = await t.run(async (ctx) => ctx.db.get(overlappingRun.jobId));
    expect(deferred).toMatchObject({ state: 'queued' });
    expect(deferred?.runnerId).toBeUndefined();

    const first = initial.assignments[0]!;
    await t.mutation(api.runners.complete, {
      workerAuthorization: {
        runnerToken,
        capabilityToken: first.assignmentToken,
        jobId: first.jobId,
        attempt: first.attempt,
        fencingToken: first.fencingToken,
      },
      state: 'completed',
    });
    const afterRelease = await t.mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 2,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    expect(afterRelease.assignments).toHaveLength(1);
    expect(afterRelease.assignments[0]).toMatchObject({ jobId: overlappingRun.jobId });
  });

  it('unlocks and claims a downstream Job only after its dependency completes', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(ownerIdentity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Runner dependency workspace',
    });
    const architectId = await asOwner.mutation(api.roleProfiles.create, {
      workspaceId,
      handle: 'architect',
      name: 'Architect',
      responsibility: 'Design the implementation.',
      instructions: 'Create the architecture first.',
      engine: 'codex',
      capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
      expectedArtifactTypes: ['sticky', 'text'],
      staticDependencyRoleProfileIds: [],
      color: '#2563eb',
    });
    const builderId = await asOwner.mutation(api.roleProfiles.create, {
      workspaceId,
      handle: 'builder',
      name: 'Builder',
      responsibility: 'Implement the approved architecture.',
      instructions: 'Wait for architecture, then build.',
      engine: 'claude',
      capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
      expectedArtifactTypes: ['sticky', 'text', 'task'],
      staticDependencyRoleProfileIds: [architectId],
      color: '#7c3aed',
    });
    const run = await asOwner.mutation(api.runs.startTeam, {
      workspaceId,
      brief: 'Design and build the dependency-ordered artifact.',
      roleProfileIds: [architectId, builderId],
      idempotencyKey: 'runner:dependency:integration:0001',
      source: 'ui',
    });
    const pairing = await t.mutation(api.runners.beginPairing, {
      runnerName: 'Dependency Runner',
      configuredConcurrency: 2,
      engines: readyEngines,
    });
    await asOwner.mutation(api.runners.approvePairing, {
      userCode: pairing.userCode,
      allowedWorkspaceIds: [workspaceId],
    });
    const exchanged = await t.mutation(api.runners.exchangePairing, {
      pairingId: pairing.pairingId,
      deviceCode: pairing.deviceCode,
    });
    if (!exchanged) throw new Error('runner_not_exchanged');

    const initial = await t.mutation(api.runners.poll, {
      runnerToken: exchanged.runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 2,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    expect(initial.assignments).toHaveLength(1);
    expect(initial.assignments[0]).toMatchObject({
      roleProfileId: architectId,
      engine: 'codex',
    });
    const architectAssignment = initial.assignments[0]!;
    const builderBefore = await t.run(async (ctx) =>
      ctx.db
        .query('jobs')
        .withIndex('by_teamRunId', (query) => query.eq('teamRunId', run.runId))
        .filter((query) => query.eq(query.field('roleProfileId'), builderId))
        .unique(),
    );
    expect(builderBefore).toMatchObject({ state: 'blocked_by_dependency' });

    await t.mutation(api.runners.complete, {
      workerAuthorization: {
        runnerToken: exchanged.runnerToken,
        capabilityToken: architectAssignment.assignmentToken,
        jobId: architectAssignment.jobId,
        attempt: architectAssignment.attempt,
        fencingToken: architectAssignment.fencingToken,
      },
      state: 'completed',
      finalMessage: 'Architecture approved.',
    });
    const builderAfter = await t.run(async (ctx) => ctx.db.get(builderBefore!._id));
    expect(builderAfter).toMatchObject({ state: 'queued' });

    const downstream = await t.mutation(api.runners.poll, {
      runnerToken: exchanged.runnerToken,
      configuredConcurrency: 2,
      freeCapacity: 2,
      engines: readyEngines,
      activeAssignments: [],
      progress: [],
    });
    expect(downstream.assignments).toHaveLength(1);
    expect(downstream.assignments[0]).toMatchObject({
      jobId: builderBefore!._id,
      roleProfileId: builderId,
      engine: 'claude',
    });
  });
});
